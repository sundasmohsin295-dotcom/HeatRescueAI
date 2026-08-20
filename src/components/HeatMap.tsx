import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ZoneTelemetry } from '@/lib/dataService';
import type { DataMode } from '@/lib/dataService';

interface HeatMapProps {
  zones: ZoneTelemetry[];
  mode: DataMode;
  selectedZoneId: string | null;
  onSelectZone: (id: string) => void;
}

function riskColor(temp: number): string {
  if (temp >= 40) return '#f87171';
  if (temp >= 37) return '#fbbf24';
  if (temp >= 33) return '#60a5fa';
  return '#34d399';
}

export function HeatMap({ zones, mode, selectedZoneId, onSelectZone }: HeatMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [40.71, -74.01],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    zones.forEach((zone) => {
      const isSelected = zone.zoneId === selectedZoneId;
      const color = riskColor(zone.temperature);

      const marker = L.circleMarker([zone.lat, zone.lng], {
        radius: isSelected ? 18 : 12,
        fillColor: color,
        color: isSelected ? '#fff' : color,
        weight: isSelected ? 3 : 1,
        opacity: 0.9,
        fillOpacity: 0.7,
      });

      marker.bindPopup(`
        <div style="padding: 4px; min-width: 160px;">
          <strong>${zone.zoneName}</strong><br/>
          Temperature: ${zone.temperature}°C<br/>
          Baseline: ${zone.baseline}°C<br/>
          Anomaly: +${(zone.temperature - zone.baseline).toFixed(1)}°C<br/>
          Persistence: ${zone.persistenceHours.toFixed(1)}h<br/>
          Source: ${mode === 'LIVE' ? 'FortyGuard' : 'DEMO'}<br/>
          <button onclick="document.dispatchEvent(new CustomEvent('selectZone', {detail: '${zone.zoneId}'}))" 
            style="margin-top: 8px; padding: 4px 12px; background: #38bdf8; color: #fff; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
            Select Zone
          </button>
        </div>
      `);

      marker.on('click', () => onSelectZone(zone.zoneId));
      marker.addTo(layerRef.current!);
    });
  }, [zones, selectedZoneId, onSelectZone, mode]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      onSelectZone(detail);
      if (mapRef.current) {
        const zone = zones.find((z) => z.zoneId === detail);
        if (zone) mapRef.current.panTo([zone.lat, zone.lng]);
      }
    };
    document.addEventListener('selectZone', handler);
    return () => document.removeEventListener('selectZone', handler);
  }, [zones, onSelectZone]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px', borderRadius: '8px', overflow: 'hidden' }} />
      <div
        className="absolute bottom-2 left-2 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ background: 'var(--map-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
      >
        <span
          className="px-2 py-0.5 rounded font-bold"
          style={{ background: mode === 'LIVE' ? 'var(--accent)' : 'var(--text-muted)', color: '#fff' }}
        >
          {mode}
        </span>
        <span>{mode === 'LIVE' ? 'FortyGuard' : 'Simulated dataset'}</span>
      </div>
      <div
        className="absolute top-2 right-2 z-[1000] flex flex-col gap-1 px-3 py-2 rounded-lg text-xs"
        style={{ background: 'var(--map-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2"><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} /> Extreme (40°C+)</div>
        <div className="flex items-center gap-2"><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} /> High (37-40°C)</div>
        <div className="flex items-center gap-2"><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa' }} /> Moderate (33-37°C)</div>
        <div className="flex items-center gap-2"><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} /> Low (33°C)</div>
      </div>
    </div>
  );
}
