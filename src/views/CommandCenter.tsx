import { useApp } from '@/context/AppContext';
import { Card, StatCard, Badge, SectionTitle, ProgressBar, Button, LoadingSpinner, EmptyState } from '@/components/ui';
import { HeatMap } from '@/components/HeatMap';
import { calculateHeatRisk, severityColor, type RiskResult } from '@/lib/riskEngine';
import { getFreshness, computeTrustScore, type ZoneTelemetry } from '@/lib/dataService';
import { isLiveConfigured } from '@/lib/fortyguard';
import { Flame, MapPin, Users, AlertTriangle, Clock, ShieldCheck, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';

export function CommandCenter() {
  const { zones, mode, setMode, selectedZoneId, selectZone, selectedZone, selectedZoneRisk, securityEvents, setActiveDomain, heatmapState, generateHeatmap, refreshData } = useApp();

  const maxRiskZone = zones.reduce<{ zone: ZoneTelemetry; risk: RiskResult }>((max, z) => {
    const r = calculateHeatRisk({
      temperature: z.temperature,
      baseline: z.baseline,
      persistenceHours: z.persistenceHours,
      threshold: z.threshold,
      solarFlux: z.solarFlux,
      vulnerabilityIndex: z.vulnerabilityIndex,
      populationExposed: z.populationExposed,
      dataQuality: z.dataQuality,
    });
    return r.score > max.risk.score ? { zone: z, risk: r } : max;
  }, { zone: zones[0], risk: calculateHeatRisk({ temperature: zones[0].temperature, baseline: zones[0].baseline, persistenceHours: zones[0].persistenceHours, threshold: zones[0].threshold, solarFlux: zones[0].solarFlux, vulnerabilityIndex: zones[0].vulnerabilityIndex, populationExposed: zones[0].populationExposed, dataQuality: zones[0].dataQuality }) });

  const totalPopExposed = zones.reduce((sum, z) => sum + z.populationExposed, 0);
  const activeIncidents = zones.filter((z) => z.temperature > 37).length;
  const securityValid = !securityEvents.some((e) => e.isolated);
  const trustScore = computeTrustScore(0.85, 2, securityValid);
  const latestTimestamp = zones.map((z) => z.timestamp).sort().reverse()[0];

  const isLoading = heatmapState.phase === 'submitting' || heatmapState.phase === 'processing';
  const hasError = heatmapState.phase === 'failed';
  const liveReady = isLiveConfigured();

  return (
    <div className="space-y-6">
      <SectionTitle title="Command Center" subtitle="15-second situational overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Max Risk Score" value={`${maxRiskZone.risk.score}/100`} sublabel={maxRiskZone.risk.severity} color={severityColor(maxRiskZone.risk.severity)} icon={<Flame size={24} />} />
        <StatCard label="Highest-Risk Zone" value={maxRiskZone.zone.zoneName} sublabel={`${maxRiskZone.zone.temperature}°C`} icon={<MapPin size={24} />} />
        <StatCard label="Population Exposed" value={totalPopExposed.toLocaleString()} sublabel="across all zones" icon={<Users size={24} />} />
        <StatCard label="Active Incidents" value={activeIncidents} sublabel="zones above 37°C" color={activeIncidents > 0 ? 'var(--warning)' : 'var(--success)'} icon={<AlertTriangle size={24} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>GIS Heat Map</h3>
            <div className="flex items-center gap-2">
              <Badge color={mode === 'LIVE' ? 'var(--accent)' : 'var(--text-muted)'}>{mode === 'LIVE' ? 'LIVE — FortyGuard' : 'DEMO — Simulated'}</Badge>
              <Button size="sm" variant="secondary" onClick={refreshData} disabled={isLoading}>
                {isLoading ? <Loader2 size={14} className="animate-spin inline" /> : <RefreshCw size={14} className="inline" />}
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button size="sm" variant="primary" onClick={generateHeatmap} disabled={isLoading || (mode === 'LIVE' && !liveReady)}>
              {isLoading ? 'Generating...' : 'Generate Heatmap'}
              </Button>
            </div>
          </div>

          <div style={{ height: '420px', position: 'relative' }}>
            {isLoading && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center rounded-lg" style={{ background: 'var(--map-overlay)' }}>
                <LoadingSpinner message={heatmapState.phase === 'submitting' ? 'Submitting to FortyGuard...' : 'Processing heatmap...'} />
              </div>
            )}
            {hasError && (
              <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 rounded-lg" style={{ background: 'var(--map-overlay)' }}>
                <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Heatmap Generation Failed</p>
                <p className="text-xs text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>{heatmapState.phase === 'failed' ? heatmapState.error : ''}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={generateHeatmap}>Retry</Button>
                  <Button size="sm" variant="secondary" onClick={() => setMode('DEMO')}>Switch to DEMO</Button>
                </div>
              </div>
            )}
            {!isLoading && !hasError && (
              <HeatMap zones={zones} mode={mode} selectedZoneId={selectedZoneId} onSelectZone={selectZone} />
            )}
          </div>

          {mode === 'LIVE' && !liveReady && (
            <p className="text-xs mt-2 p-2 rounded" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
              LIVE mode selected but no backend proxy is deployed. Switch to DEMO mode or deploy the fortyguard-proxy edge function.
            </p>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Situational Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Current Situation</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Extreme heat event</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Data Freshness</span>
                <span className="font-medium flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                  <Clock size={14} /> {getFreshness(latestTimestamp)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Security Status</span>
                <span className="font-medium flex items-center gap-1" style={{ color: securityValid ? 'var(--success)' : 'var(--danger)' }}>
                  <ShieldCheck size={14} /> {securityValid ? 'SECURE' : 'ALERT'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Trust Score</span>
                <span className="font-medium" style={{ color: 'var(--accent)' }}>{trustScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Trajectory</span>
                <span className="font-medium flex items-center gap-1" style={{ color: 'var(--warning)' }}>
                  <TrendingUp size={14} /> Worsening
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Heatmap Status</span>
                <span className="font-medium" style={{ color: heatmapState.phase === 'completed' ? 'var(--success)' : heatmapState.phase === 'failed' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {heatmapState.phase === 'completed' ? 'Loaded' : heatmapState.phase === 'failed' ? 'Failed' : heatmapState.phase === 'idle' ? 'Not loaded' : 'Loading...'}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Hotspot Triage</h3>
            <div className="space-y-3">
              {zones
                .map((z) => ({
                  zone: z,
                  risk: calculateHeatRisk({
                    temperature: z.temperature,
                    baseline: z.baseline,
                    persistenceHours: z.persistenceHours,
                    threshold: z.threshold,
                    solarFlux: z.solarFlux,
                    vulnerabilityIndex: z.vulnerabilityIndex,
                    populationExposed: z.populationExposed,
                    dataQuality: z.dataQuality,
                  }),
                }))
                .sort((a, b) => b.risk.score - a.risk.score)
                .slice(0, 3)
                .map(({ zone, risk }) => (
                  <button
                    key={zone.zoneId}
                    onClick={() => selectZone(zone.zoneId)}
                    className="w-full text-left p-3 rounded-lg transition-colors"
                    style={{
                      background: zone.zoneId === selectedZoneId ? 'var(--accent-soft)' : 'var(--surface-elevated)',
                      border: `1px solid ${zone.zoneId === selectedZoneId ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{zone.zoneName}</span>
                      <Badge color={severityColor(risk.severity)}>{risk.severity}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span>{zone.temperature}°C | {zone.populationExposed.toLocaleString()} exposed</span>
                      <span className="font-semibold" style={{ color: severityColor(risk.severity) }}>{risk.score}/100</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={risk.score} color={severityColor(risk.severity)} />
                    </div>
                  </button>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {selectedZone && selectedZoneRisk && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Selected Zone: {selectedZone.zoneName}</h3>
            <Button size="sm" variant="secondary" onClick={() => setActiveDomain('ai')}>Investigate</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Temperature</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedZone.temperature}°C</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Anomaly</p>
              <p className="text-lg font-bold" style={{ color: 'var(--warning)' }}>+{(selectedZone.temperature - selectedZone.baseline).toFixed(1)}°C</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Risk Score</p>
              <p className="text-lg font-bold" style={{ color: severityColor(selectedZoneRisk.severity) }}>{selectedZoneRisk.score}/100</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence</p>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{selectedZoneRisk.confidence}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
