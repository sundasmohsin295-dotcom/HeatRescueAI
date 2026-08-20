import type { DataMode, ZoneTelemetry } from './dataService';
import { DEMO_ZONES } from './dataService';

export interface FortyGuardHeatmapRequest {
  polygonAoi: {
    type: 'FeatureCollection';
    features: {
      type: 'Feature';
      properties: Record<string, unknown>;
      geometry: {
        type: 'Polygon';
        coordinates: number[][][];
      };
    }[];
  };
  dateTime: {
    startDate: string;
    startTime: string;
    filterType: number;
  };
  granularity: 60 | 80 | 100;
}

export interface FortyGuardStatusResponse {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  mapData?: GeoJSON.FeatureCollection;
  statsData?: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  error?: string;
}

export type HeatmapState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'processing'; activityId: string }
  | { phase: 'completed'; mapData: GeoJSON.FeatureCollection; stats: { min: number; max: number; mean: number; std: number } }
  | { phase: 'failed'; error: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isLiveConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function requestHeatmap(
  _request: FortyGuardHeatmapRequest,
  mode: DataMode,
  onStateChange: (state: HeatmapState) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (mode === 'DEMO') {
    onStateChange({ phase: 'submitting' });
    await delay(600, signal);
    onStateChange({
      phase: 'processing',
      activityId: 'demo-activity-' + Date.now(),
    });
    await delay(1200, signal);
    onStateChange({
      phase: 'completed',
      mapData: generateDemoGeoJSON(),
      stats: { min: 33.2, max: 41.8, mean: 37.6, std: 2.8 },
    });
    return;
  }

  if (!isLiveConfigured()) {
    onStateChange({
      phase: 'failed',
      error: 'LIVE mode requires a secure backend proxy. No Supabase Edge Function is deployed for FortyGuard. Switch to DEMO mode or deploy the fortyguard-proxy edge function.',
    });
    return;
  }

  onStateChange({ phase: 'submitting' });

  try {
    const submitRes = await fetch(`${SUPABASE_URL}/functions/v1/fortyguard-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'submit', request: _request }),
      signal,
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      let errorMsg = `Heatmap request failed (HTTP ${submitRes.status}).`;
      if (submitRes.status === 401) errorMsg = 'FortyGuard authentication failed. Check API key configuration.';
      else if (submitRes.status === 429) errorMsg = 'API rate limit reached. Please retry later.';
      else if (submitRes.status === 403) errorMsg = 'Access forbidden. API key may lack permissions.';
      else if (errText) errorMsg = `Heatmap request failed: ${errText.slice(0, 200)}`;
      onStateChange({ phase: 'failed', error: errorMsg });
      return;
    }

    const submitData = await submitRes.json();
    const activityId: string = submitData.activity_id;
    if (!activityId) {
      onStateStateError(onStateChange, 'No activity_id returned from FortyGuard.');
      return;
    }

    onStateChange({ phase: 'processing', activityId });

    const maxPolls = 30;
    for (let i = 0; i < maxPolls; i++) {
      await delay(2000, signal);
      if (signal?.aborted) return;

      const pollRes = await fetch(`${SUPABASE_URL}/functions/v1/fortyguard-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'status', activityId }),
        signal,
      });

      if (!pollRes.ok) {
        if (pollRes.status === 429) {
          onStateChange({ phase: 'failed', error: 'API rate limit reached during polling.' });
          return;
        }
        continue;
      }

      const pollData: FortyGuardStatusResponse = await pollRes.json();
      if (pollData.status === 'COMPLETED' && pollData.mapData) {
        onStateChange({
          phase: 'completed',
          mapData: pollData.mapData,
          stats: pollData.statsData ?? { min: 0, max: 0, mean: 0, std: 0 },
        });
        return;
      }
      if (pollData.status === 'FAILED') {
        onStateChange({ phase: 'failed', error: pollData.error ?? 'FortyGuard processing failed.' });
        return;
      }
    }

    onStateChange({ phase: 'failed', error: 'Heatmap polling timed out after 60 seconds.' });
  } catch (err) {
    if (signal?.aborted) return;
    const msg = err instanceof Error ? err.message : 'Network connection failed.';
    onStateChange({ phase: 'failed', error: msg });
  }
}

function onStateStateError(onStateChange: (s: HeatmapState) => void, msg: string) {
  onStateChange({ phase: 'failed', error: msg });
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export function generateDemoGeoJSON(): GeoJSON.FeatureCollection {
  const zones = DEMO_ZONES;
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature' as const,
      properties: {
        zoneId: z.zoneId,
        zoneName: z.zoneName,
        temperature: z.temperature,
        risk: z.temperature > 40 ? 'EXTREME' : z.temperature > 37 ? 'HIGH' : z.temperature > 33 ? 'MODERATE' : 'LOW',
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [z.lng - 0.005, z.lat - 0.003],
            [z.lng + 0.005, z.lat - 0.003],
            [z.lng + 0.005, z.lat + 0.003],
            [z.lng - 0.005, z.lat + 0.003],
            [z.lng - 0.005, z.lat - 0.003],
          ],
        ],
      },
    })),
  };
}

export function extractZonesFromGeoJSON(geojson: GeoJSON.FeatureCollection, mode: DataMode): ZoneTelemetry[] {
  return geojson.features.map((f, i) => {
    const props = f.properties as Record<string, unknown>;
    const temp = (props.temperature as number) ?? 35;
    const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : [];
    const center = coords.length > 0 ? coords[0] : [0, 0];
    return {
      zoneId: (props.zoneId as string) ?? `zone-${i}`,
      zoneName: (props.zoneName as string) ?? `Zone ${i + 1}`,
      lat: center[1],
      lng: center[0],
      temperature: temp,
      baseline: 35,
      persistenceHours: 2,
      threshold: 30,
      solarFlux: 700,
      vulnerabilityIndex: 0.6,
      populationExposed: 10000,
      dataQuality: mode === 'LIVE' ? 0.9 : 0.82,
      timestamp: new Date().toISOString(),
    };
  });
}
