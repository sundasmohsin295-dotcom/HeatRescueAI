import { useApp } from '@/context/AppContext';
import { Card, SectionTitle, Button, Badge, ProgressBar } from '@/components/ui';
import { calculateHeatRisk, severityColor } from '@/lib/riskEngine';
import { applySimulation, type SimulationInput } from '@/lib/dataService';
import { FlaskConical, RotateCcw, Droplets, TreePine, Thermometer } from 'lucide-react';
import { useState } from 'react';

export function SimulationLab() {
  const { zones, selectedZoneId, selectZone, pushToast, addAuditEvent } = useApp();
  const [ambientShift, setAmbientShift] = useState(0);
  const [canopyExpansion, setCanopyExpansion] = useState(0);
  const [misting, setMisting] = useState(false);

  const zone = zones.find((z) => z.zoneId === selectedZoneId) ?? zones[0];

  const sim: SimulationInput = { ambientShift, canopyExpansion, misting };
  const baselineZone = zone;
  const scenarioZone = applySimulation(baselineZone, sim);

  const baselineRisk = calculateHeatRisk({
    temperature: baselineZone.temperature,
    baseline: baselineZone.baseline,
    persistenceHours: baselineZone.persistenceHours,
    threshold: baselineZone.threshold,
    solarFlux: baselineZone.solarFlux,
    vulnerabilityIndex: baselineZone.vulnerabilityIndex,
    populationExposed: baselineZone.populationExposed,
    dataQuality: baselineZone.dataQuality,
  });

  const scenarioRisk = calculateHeatRisk({
    temperature: scenarioZone.temperature,
    baseline: scenarioZone.baseline,
    persistenceHours: scenarioZone.persistenceHours,
    threshold: scenarioZone.threshold,
    solarFlux: scenarioZone.solarFlux,
    vulnerabilityIndex: scenarioZone.vulnerabilityIndex,
    populationExposed: scenarioZone.populationExposed,
    dataQuality: scenarioZone.dataQuality,
  });

  const delta = scenarioRisk.score - baselineRisk.score;
  const pctChange = baselineRisk.score > 0 ? ((delta / baselineRisk.score) * 100).toFixed(1) : '0';

  const handleReset = () => {
    setAmbientShift(0);
    setCanopyExpansion(0);
    setMisting(false);
    pushToast('INFO', 'Simulation reset.', 'All parameters restored to baseline.');
  };

  const handleApply = async () => {
    await addAuditEvent('SIMULATION_RUN', `Zone: ${zone.zoneName}, Shift: ${ambientShift}°C, Canopy: ${canopyExpansion}%, Misting: ${misting}`, 'SIMULATION');
    pushToast('SUCCESS', 'Simulation recorded.', `Baseline ${baselineRisk.score} → Scenario ${scenarioRisk.score} (Δ${delta > 0 ? '+' : ''}${delta})`);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Prediction & Simulation Lab" subtitle="Interactive What-If analysis using the canonical risk engine" />

      <div className="flex items-center gap-2">
        <Badge color="var(--warning)">SIMULATION</Badge>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Counterfactual analysis — not a scientific forecast</span>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <select
            value={zone.zoneId}
            onChange={(e) => selectZone(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            {zones.map((z) => (
              <option key={z.zoneId} value={z.zoneId}>{z.zoneName} ({z.temperature}°C)</option>
            ))}
          </select>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Thermometer size={16} /> Ambient Temperature Shift
              </label>
              <span className="text-sm font-bold" style={{ color: ambientShift > 0 ? 'var(--danger)' : ambientShift < 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                {ambientShift > 0 ? '+' : ''}{ambientShift}°C
              </span>
            </div>
            <input
              type="range"
              min={-3}
              max={6}
              step={1}
              value={ambientShift}
              onChange={(e) => setAmbientShift(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>-3°C</span><span>0°C</span><span>+6°C</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <TreePine size={16} /> Tree Canopy Expansion
              </label>
              <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>{canopyExpansion}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={canopyExpansion}
              onChange={(e) => setCanopyExpansion(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--success)' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>0%</span><span>20%</span><span>40%</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Droplets size={16} /> Misting Infrastructure
            </label>
            <button
              onClick={() => setMisting(!misting)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: misting ? 'var(--info-soft)' : 'var(--surface-elevated)',
                border: `1px solid ${misting ? 'var(--info)' : 'var(--border)'}`,
              }}
            >
              <div
                className="w-10 h-5 rounded-full transition-colors relative"
                style={{ background: misting ? 'var(--info)' : 'var(--border-strong)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: misting ? 'translateX(20px)' : 'translateX(2px)' }}
                />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{misting ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Baseline</h3>
            <Badge color={severityColor(baselineRisk.severity)}>{baselineRisk.severity}</Badge>
          </div>
          <div className="text-center py-4">
            <p className="text-4xl font-bold" style={{ color: severityColor(baselineRisk.severity) }}>{baselineRisk.score}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Risk Score / 100</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Temperature</span>
              <span style={{ color: 'var(--text-primary)' }}>{baselineZone.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Solar Flux</span>
              <span style={{ color: 'var(--text-primary)' }}>{baselineZone.solarFlux} W/m²</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Scenario (Counterfactual)</h3>
            <Badge color={severityColor(scenarioRisk.severity)}>{scenarioRisk.severity}</Badge>
          </div>
          <div className="text-center py-4">
            <p className="text-4xl font-bold" style={{ color: severityColor(scenarioRisk.severity) }}>{scenarioRisk.score}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Risk Score / 100</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Temperature</span>
              <span style={{ color: 'var(--text-primary)' }}>{scenarioZone.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Solar Flux</span>
              <span style={{ color: 'var(--text-primary)' }}>{scenarioZone.solarFlux.toFixed(0)} W/m²</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Risk Delta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Delta</p>
            <p className="text-3xl font-bold" style={{ color: delta < 0 ? 'var(--success)' : delta > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {delta > 0 ? '+' : ''}{delta}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Percentage Change</p>
            <p className="text-3xl font-bold" style={{ color: delta < 0 ? 'var(--success)' : delta > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {delta < 0 ? '' : delta > 0 ? '+' : ''}{pctChange}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Risk Reduction</p>
            <p className="text-3xl font-bold" style={{ color: delta < 0 ? 'var(--success)' : 'var(--text-muted)' }}>
              {delta < 0 ? `${Math.abs(Number(pctChange)).toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={scenarioRisk.score} color={severityColor(scenarioRisk.severity)} />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleApply} variant="primary"><FlaskConical size={16} className="inline mr-1" /> Record Simulation</Button>
        <Button onClick={handleReset} variant="secondary"><RotateCcw size={16} className="inline mr-1" /> Reset</Button>
      </div>
    </div>
  );
}
