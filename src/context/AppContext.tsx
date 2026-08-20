import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { ZoneTelemetry, DataMode, DispatchItem } from '@/lib/dataService';
import { DEMO_ZONES, DEMO_DISPATCHES } from '@/lib/dataService';
import type { RiskResult } from '@/lib/riskEngine';
import { calculateHeatRisk } from '@/lib/riskEngine';
import { appendAuditEvent, verifyChainIntegrity, loadChain, type AuditEvent, type ChainVerification } from '@/lib/auditChain';
import { validateTelemetry, type TelemetryReading, type ValidationResult, RATE_OF_CHANGE_LIMIT } from '@/lib/security';
import { requestHeatmap, extractZonesFromGeoJSON, isLiveConfigured, type HeatmapState, type FortyGuardHeatmapRequest } from '@/lib/fortyguard';

export type Theme = 'theme-dark' | 'theme-light';
export type DomainId = 'command' | 'intelligence' | 'ai' | 'simulation' | 'response' | 'cyber' | 'audit' | 'admin';

export interface Toast {
  id: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY';
  message: string;
  detail?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  sensorId: string;
  description: string;
  state: ValidationResult['state'];
  rateOfChange?: number;
  isDemo: boolean;
  isolated: boolean;
}

interface AppState {
  theme: Theme;
  toggleTheme: () => void;

  mode: DataMode;
  setMode: (m: DataMode) => void;

  activeDomain: DomainId;
  setActiveDomain: (d: DomainId) => void;

  zones: ZoneTelemetry[];
  selectedZoneId: string | null;
  selectZone: (id: string | null) => void;
  selectedZone: ZoneTelemetry | null;
  selectedZoneRisk: RiskResult | null;

  heatmapState: HeatmapState;
  generateHeatmap: () => Promise<void>;
  refreshData: () => Promise<void>;
  abortHeatmap: () => void;

  dispatches: DispatchItem[];
  authorizeDispatch: (id: string) => Promise<void>;
  advanceDispatch: (id: string) => Promise<void>;

  auditEvents: AuditEvent[];
  chainVerification: ChainVerification | null;
  verifyChain: () => Promise<void>;
  addAuditEvent: (action: string, resource: string, eventType: string) => Promise<AuditEvent>;

  securityEvents: SecurityEvent[];
  testAntiSpoof: () => Promise<void>;
  resetIsolation: () => void;

  toasts: Toast[];
  pushToast: (type: Toast['type'], message: string, detail?: string) => void;
  dismissToast: (id: string) => void;

  adminSettings: AdminSettings;
  saveAdminSettings: (s: AdminSettings) => void;

  judgeDemoRunning: boolean;
  judgeDemoStep: number;
  judgeDemoTotal: number;
  launchJudgeDemo: () => Promise<void>;
  cancelJudgeDemo: () => void;
}

export interface AdminSettings {
  pollingFrequency: number;
  spatialResolution: 60 | 80 | 100;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('heatrescue-theme') as Theme | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'theme-light' : 'theme-dark';
  });

  const [mode, setModeState] = useState<DataMode>('DEMO');
  const [activeDomain, setActiveDomain] = useState<DomainId>('command');
  const [zones, setZones] = useState<ZoneTelemetry[]>(DEMO_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [dispatches, setDispatches] = useState<DispatchItem[]>(DEMO_DISPATCHES);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(loadChain());
  const [chainVerification, setChainVerification] = useState<ChainVerification | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    pollingFrequency: 30,
    spatialResolution: 100,
  });
  const [judgeDemoRunning, setJudgeDemoRunning] = useState(false);
  const [judgeDemoStep, setJudgeDemoStep] = useState(0);
  const [judgeDemoTotal, setJudgeDemoTotal] = useState(15);
  const [heatmapState, setHeatmapState] = useState<HeatmapState>({ phase: 'idle' });
  const cancelRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('heatrescue-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'theme-dark' ? 'theme-light' : 'theme-dark'));
  }, []);

  const pushToast = useCallback((type: Toast['type'], message: string, detail?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message, detail }]);
    if (type !== 'ERROR' && type !== 'SECURITY') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addAuditEvent = useCallback(async (action: string, resource: string, eventType: string) => {
    const event = await appendAuditEvent('operator', action, resource, eventType);
    setAuditEvents(loadChain());
    return event;
  }, []);

  const setMode = useCallback((m: DataMode) => {
    setModeState(m);
    setHeatmapState({ phase: 'idle' });
  }, []);

  const selectedZone = zones.find((z) => z.zoneId === selectedZoneId) ?? null;
  const selectedZoneRisk = selectedZone
    ? calculateHeatRisk({
        temperature: selectedZone.temperature,
        baseline: selectedZone.baseline,
        persistenceHours: selectedZone.persistenceHours,
        threshold: selectedZone.threshold,
        solarFlux: selectedZone.solarFlux,
        vulnerabilityIndex: selectedZone.vulnerabilityIndex,
        populationExposed: selectedZone.populationExposed,
        dataQuality: selectedZone.dataQuality,
      })
    : null;

  const selectZone = useCallback((id: string | null) => {
    setSelectedZoneId(id);
  }, []);

  const buildHeatmapRequest = useCallback((): FortyGuardHeatmapRequest => {
    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);
    const startTime = now.toTimeString().slice(0, 5);
    return {
      polygonAoi: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.017, 40.705],
              [-74.003, 40.705],
              [-74.003, 40.718],
              [-74.017, 40.718],
              [-74.017, 40.705],
            ]],
          },
        }],
      },
      dateTime: { startDate, startTime, filterType: 1 },
      granularity: adminSettings.spatialResolution,
    };
  }, [adminSettings.spatialResolution]);

  const generateHeatmap = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const request = buildHeatmapRequest();
    await requestHeatmap(request, mode, (state) => {
      setHeatmapState(state);
      if (state.phase === 'completed') {
        const newZones = extractZonesFromGeoJSON(state.mapData, mode);
        if (newZones.length > 0) {
          setZones(newZones);
        }
        pushToast('SUCCESS', 'Heatmap generated successfully.', `${newZones.length} zones rendered from ${mode === 'LIVE' ? 'FortyGuard' : 'DEMO'} data.`);
      } else if (state.phase === 'failed') {
        pushToast('ERROR', 'Heatmap generation failed.', state.error);
      }
    }, controller.signal);
  }, [buildHeatmapRequest, mode, pushToast]);

  const refreshData = useCallback(async () => {
    await generateHeatmap();
  }, [generateHeatmap]);

  const abortHeatmap = useCallback(() => {
    abortRef.current?.abort();
    setHeatmapState({ phase: 'idle' });
  }, []);

  const authorizeDispatch = useCallback(async (id: string) => {
    const item = dispatches.find((d) => d.id === id);
    if (!item) return;
    if (item.status !== 'PENDING_APPROVAL' && item.status !== 'RECOMMENDED') return;

    setDispatches((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'AUTHORIZED' } : d)),
    );
    await addAuditEvent('AUTHORIZE_DISPATCH', `Dispatch ${id} (${item.incident} in ${item.zone})`, 'DISPATCH');
    pushToast('SUCCESS', `Dispatch authorized for ${item.zone}.`, 'SIMULATED DISPATCH — no physical resource deployed.');
  }, [dispatches, addAuditEvent, pushToast]);

  const advanceDispatch = useCallback(async (id: string) => {
    const item = dispatches.find((d) => d.id === id);
    if (!item) return;
    if (item.status !== 'AUTHORIZED') return;

    setDispatches((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'DISPATCHED' } : d)),
    );
    await addAuditEvent('DISPATCH_SENT', `Dispatch ${id} for ${item.zone}`, 'DISPATCH');
    pushToast('INFO', `Dispatch ${id} marked as DISPATCHED.`, 'SIMULATED — no physical resource was deployed.');
  }, [dispatches, addAuditEvent, pushToast]);

  const verifyChain = useCallback(async () => {
    const result = await verifyChainIntegrity();
    setChainVerification(result);
    if (result.valid) {
      pushToast('SUCCESS', 'Audit chain integrity verified.', `${result.totalEvents} events validated.`);
    } else {
      pushToast('ERROR', 'AUDIT INTEGRITY COMPROMISED', result.reason);
    }
  }, [pushToast]);

  const testAntiSpoof = useCallback(async () => {
    const sensorId = 'sensor-demo-01';
    const prev: TelemetryReading = {
      sensorId,
      temperature: 39.2,
      timestamp: Date.now() - 30000,
      zone: 'Downtown Core',
    };
    const curr: TelemetryReading = {
      sensorId,
      temperature: 52.8,
      timestamp: Date.now(),
      zone: 'Downtown Core',
    };

    const result = validateTelemetry(curr, prev);
    const rate = result.rateOfChange ?? Math.abs(curr.temperature - prev.temperature) / 0.5;

    const event: SecurityEvent = {
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sensorId,
      description: `Impossible thermal jump: ${prev.temperature}°C → ${curr.temperature}°C in 30s (${rate.toFixed(1)}°C/min). Limit: ${RATE_OF_CHANGE_LIMIT}°C/min.`,
      state: result.state,
      rateOfChange: rate,
      isDemo: true,
      isolated: true,
    };

    setSecurityEvents((prev) => [...prev, event]);
    await addAuditEvent('ISOLATE_NODE', `Sensor ${sensorId} isolated — rate ${rate.toFixed(1)}°C/min exceeds ${RATE_OF_CHANGE_LIMIT}°C/min`, 'SECURITY');
    pushToast('SECURITY', 'DEMO SECURITY EVENT: Sensor isolated.', `Rate of change ${rate.toFixed(1)}°C/min exceeds physical limit. Node ${sensorId} isolated.`);
  }, [addAuditEvent, pushToast]);

  const resetIsolation = useCallback(() => {
    setSecurityEvents([]);
    pushToast('INFO', 'Security simulation state reset.', 'All isolated sensors restored to TRUSTED.');
  }, [pushToast]);

  const saveAdminSettings = useCallback((s: AdminSettings) => {
    setAdminSettings(s);
    pushToast('SUCCESS', 'Administration settings saved.', `Polling: ${s.pollingFrequency}s, Resolution: ${s.spatialResolution}m`);
  }, [pushToast]);

  const launchJudgeDemo = useCallback(async () => {
    if (judgeDemoRunning) return;
    cancelRef.current = false;
    setJudgeDemoRunning(true);
    setJudgeDemoStep(0);
    setJudgeDemoTotal(15);

    const steps: { domain: DomainId; step: number; toast: Toast; action?: () => Promise<void> }[] = [
      { domain: 'command', step: 1, toast: { id: '', type: 'INFO', message: 'Judge Demo started.', detail: 'Step 1/15: Command Center — situational overview.' } },
      { domain: 'command', step: 2, toast: { id: '', type: 'INFO', message: 'Highest-risk hotspot identified: Downtown Core (risk 82/100).', detail: 'Step 2/15: Triage complete.' }, action: async () => { selectZone('zone-a'); } },
      { domain: 'intelligence', step: 3, toast: { id: '', type: 'INFO', message: 'Heat Intelligence loaded.', detail: 'Step 3/15: Baseline microclimate data displayed.' } },
      { domain: 'intelligence', step: 4, toast: { id: '', type: 'INFO', message: 'Temperature anomaly confirmed: +5.6°C above baseline.', detail: 'Step 4/15: Sensor metrics verified.' } },
      { domain: 'ai', step: 5, toast: { id: '', type: 'INFO', message: 'AI Investigator engaged.', detail: 'Step 5/15: Explainable evidence trace generated.' } },
      { domain: 'ai', step: 6, toast: { id: '', type: 'INFO', message: 'Evidence linked to sensor metrics — zero hallucinations.', detail: 'Step 6/15: Investigation complete.' } },
      { domain: 'simulation', step: 7, toast: { id: '', type: 'INFO', message: 'Simulation Lab opened.', detail: 'Step 7/15: What-If analysis starting.' } },
      { domain: 'simulation', step: 8, toast: { id: '', type: 'INFO', message: 'Applied +3°C ambient shift — risk delta calculated.', detail: 'Step 8/15: Baseline vs. counterfactual compared.' } },
      { domain: 'response', step: 9, toast: { id: '', type: 'INFO', message: 'Response Operations opened.', detail: 'Step 9/15: Dispatch triage table loaded.' } },
      { domain: 'response', step: 10, toast: { id: '', type: 'INFO', message: 'Selecting critical dispatch recommendation.', detail: 'Step 10/15: Human approval required.' } },
      { domain: 'response', step: 11, toast: { id: '', type: 'INFO', message: 'Authorizing simulated dispatch...', detail: 'Step 11/15: Human-in-the-loop approval.' }, action: async () => { await authorizeDispatch('disp-001'); } },
      { domain: 'cyber', step: 12, toast: { id: '', type: 'INFO', message: 'Cybersecurity domain opened.', detail: 'Step 12/15: Zero-trust telemetry verification.' } },
      { domain: 'cyber', step: 13, toast: { id: '', type: 'SECURITY', message: 'Anti-spoof test triggered.', detail: 'Step 13/15: Simulating impossible thermal jump.' }, action: async () => { await testAntiSpoof(); } },
      { domain: 'audit', step: 14, toast: { id: '', type: 'INFO', message: 'Incidents & Audit opened.', detail: 'Step 14/15: Verifying SHA-256 chain integrity.' }, action: async () => { await verifyChain(); } },
      { domain: 'audit', step: 15, toast: { id: '', type: 'SUCCESS', message: 'Judge Demo complete.', detail: 'Step 15/15: All domains verified. Audit chain valid.' } },
    ];

    for (const s of steps) {
      if (cancelRef.current) break;
      setJudgeDemoStep(s.step);
      setActiveDomain(s.domain);
      pushToast(s.toast.type, s.toast.message, s.toast.detail);
      if (s.action) {
        await delay(800);
        if (cancelRef.current) break;
        await s.action();
      }
      await delay(1200);
    }

    setJudgeDemoRunning(false);
    setJudgeDemoStep(0);
  }, [judgeDemoRunning, selectZone, authorizeDispatch, testAntiSpoof, verifyChain, pushToast]);

  const cancelJudgeDemo = useCallback(() => {
    cancelRef.current = true;
    setJudgeDemoRunning(false);
    setJudgeDemoStep(0);
    pushToast('WARNING', 'Judge Demo cancelled.', 'Demo stopped by user.');
  }, [pushToast]);

  const value: AppState = {
    theme,
    toggleTheme,
    mode,
    setMode,
    activeDomain,
    setActiveDomain,
    zones,
    selectedZoneId,
    selectZone,
    selectedZone,
    selectedZoneRisk,
    heatmapState,
    generateHeatmap,
    refreshData,
    abortHeatmap,
    dispatches,
    authorizeDispatch,
    advanceDispatch,
    auditEvents,
    chainVerification,
    verifyChain,
    addAuditEvent,
    securityEvents,
    testAntiSpoof,
    resetIsolation,
    toasts,
    pushToast,
    dismissToast,
    adminSettings,
    saveAdminSettings,
    judgeDemoRunning,
    judgeDemoStep,
    judgeDemoTotal,
    launchJudgeDemo,
    cancelJudgeDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
