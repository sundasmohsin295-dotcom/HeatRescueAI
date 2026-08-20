import type { RiskResult } from './riskEngine';

export type DataMode = 'LIVE' | 'DEMO';

export interface ZoneTelemetry {
  zoneId: string;
  zoneName: string;
  lat: number;
  lng: number;
  temperature: number;
  baseline: number;
  persistenceHours: number;
  threshold: number;
  solarFlux: number;
  vulnerabilityIndex: number;
  populationExposed: number;
  dataQuality: number;
  timestamp: string;
}

export interface NormalizedObservation {
  id: string;
  source: string;
  timestamp: string;
  temperature: number;
  zone: string;
  dataQuality: number;
  freshness: string;
  mode: DataMode;
}

export const DEMO_ZONES: ZoneTelemetry[] = [
  {
    zoneId: 'zone-a',
    zoneName: 'Downtown Core',
    lat: 40.712,
    lng: -74.01,
    temperature: 41.8,
    baseline: 36.2,
    persistenceHours: 3.2,
    threshold: 30,
    solarFlux: 820,
    vulnerabilityIndex: 0.78,
    populationExposed: 42000,
    dataQuality: 0.88,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    zoneId: 'zone-b',
    zoneName: 'Industrial District',
    lat: 40.718,
    lng: -74.003,
    temperature: 39.4,
    baseline: 35.8,
    persistenceHours: 2.5,
    threshold: 30,
    solarFlux: 780,
    vulnerabilityIndex: 0.62,
    populationExposed: 18000,
    dataQuality: 0.82,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    zoneId: 'zone-c',
    zoneName: 'Riverside Park',
    lat: 40.705,
    lng: -74.017,
    temperature: 33.2,
    baseline: 33.0,
    persistenceHours: 0.5,
    threshold: 30,
    solarFlux: 690,
    vulnerabilityIndex: 0.35,
    populationExposed: 8000,
    dataQuality: 0.91,
    timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
  {
    zoneId: 'zone-d',
    zoneName: 'Eastside Residential',
    lat: 40.71,
    lng: -73.995,
    temperature: 38.1,
    baseline: 35.0,
    persistenceHours: 1.8,
    threshold: 30,
    solarFlux: 740,
    vulnerabilityIndex: 0.71,
    populationExposed: 25000,
    dataQuality: 0.79,
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    zoneId: 'zone-e',
    zoneName: 'Harbor Point',
    lat: 40.7,
    lng: -74.02,
    temperature: 35.6,
    baseline: 34.5,
    persistenceHours: 1.2,
    threshold: 30,
    solarFlux: 710,
    vulnerabilityIndex: 0.48,
    populationExposed: 12000,
    dataQuality: 0.85,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

export interface DispatchItem {
  id: string;
  incident: string;
  zone: string;
  riskScore: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedResource: string;
  status: 'RECOMMENDED' | 'PENDING_APPROVAL' | 'AUTHORIZED' | 'DISPATCHED' | 'COMPLETED';
  personnel: string;
  timestamp: string;
}

export const DEMO_DISPATCHES: DispatchItem[] = [
  {
    id: 'disp-001',
    incident: 'Extreme heat exposure',
    zone: 'Downtown Core',
    riskScore: 82,
    priority: 'CRITICAL',
    recommendedResource: 'Mobile cooling unit + water distribution',
    status: 'PENDING_APPROVAL',
    personnel: 'Response Team Alpha',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'disp-002',
    incident: 'Vulnerable population at risk',
    zone: 'Eastside Residential',
    riskScore: 67,
    priority: 'HIGH',
    recommendedResource: 'Cooling center activation',
    status: 'RECOMMENDED',
    personnel: 'Medical Team Bravo',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'disp-003',
    incident: 'Outdoor worker exposure',
    zone: 'Industrial District',
    riskScore: 58,
    priority: 'MEDIUM',
    recommendedResource: 'Hydration station deployment',
    status: 'RECOMMENDED',
    personnel: 'Response Team Charlie',
    timestamp: new Date().toISOString(),
  },
];

export function normalizeZone(zone: ZoneTelemetry, mode: DataMode): NormalizedObservation {
  return {
    id: zone.zoneId,
    source: mode === 'LIVE' ? 'FortyGuard' : 'Simulated dataset',
    timestamp: zone.timestamp,
    temperature: zone.temperature,
    zone: zone.zoneName,
    dataQuality: zone.dataQuality,
    freshness: getFreshness(zone.timestamp),
    mode,
  };
}

export function getFreshness(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function computeTrustScore(dataQuality: number, freshnessMin: number, securityValid: boolean): number {
  const qualityScore = dataQuality * 40;
  const freshnessScore = Math.max(0, 30 - freshnessMin * 2);
  const securityScore = securityValid ? 30 : 0;
  return Math.min(100, Math.round(qualityScore + freshnessScore + securityScore));
}

export interface SimulationInput {
  ambientShift: number;
  canopyExpansion: number;
  misting: boolean;
}

export function applySimulation(base: ZoneTelemetry, sim: SimulationInput): ZoneTelemetry {
  const canopyReduction = sim.canopyExpansion * 0.15;
  const mistingReduction = sim.misting ? 2.5 : 0;
  const adjustedTemp = base.temperature + sim.ambientShift - canopyReduction - mistingReduction;
  return {
    ...base,
    temperature: Math.max(0, adjustedTemp),
    solarFlux: Math.max(0, base.solarFlux - sim.canopyExpansion * 8 - (sim.misting ? 30 : 0)),
  };
}

export interface AIFinding {
  finding: string;
  evidence: { label: string; value: string }[];
  rule: string;
  confidence: 'Low' | 'Medium' | 'High';
  recommendation: string;
  timestamp: string;
}

export function generateFindings(zone: ZoneTelemetry, risk: RiskResult): AIFinding[] {
  const findings: AIFinding[] = [];

  findings.push({
    finding: `Elevated thermal risk detected in ${zone.zoneName}.`,
    evidence: [
      { label: 'Air Temperature', value: `${zone.temperature}°C` },
      { label: 'Baseline', value: `${zone.baseline}°C` },
      { label: 'Anomaly', value: `+${(zone.temperature - zone.baseline).toFixed(1)}°C` },
      { label: 'Persistence', value: `${zone.persistenceHours.toFixed(1)} hours` },
      { label: 'Threshold', value: `${zone.threshold}°C` },
      { label: 'Risk Contribution', value: risk.contributors[0]?.detail ?? 'N/A' },
    ],
    rule: 'Temperature anomaly > 3°C AND persistence > 2 hours',
    confidence: risk.confidence > 70 ? 'High' : 'Medium',
    recommendation: `Prioritize ${zone.zoneName} for immediate intervention. Deploy cooling resources to reduce exposure for ${zone.populationExposed.toLocaleString()} residents.`,
    timestamp: new Date().toISOString(),
  });

  if (zone.solarFlux > 700) {
    findings.push({
      finding: 'High solar flux contributing to surface heating.',
      evidence: [
        { label: 'Solar Flux', value: `${zone.solarFlux} W/m²` },
        { label: 'Risk Contribution', value: `+${Math.min(15, Math.round((zone.solarFlux - 400) / 50))}` },
      ],
      rule: 'Solar flux > 700 W/m²',
      confidence: 'High',
      recommendation: 'Recommend shade infrastructure and reflective surfaces in high-exposure areas.',
      timestamp: new Date().toISOString(),
    });
  }

  if (zone.vulnerabilityIndex > 0.65) {
    findings.push({
      finding: 'High vulnerability index indicates elevated population susceptibility.',
      evidence: [
        { label: 'Vulnerability Index', value: zone.vulnerabilityIndex.toFixed(2) },
        { label: 'Population Exposed', value: zone.populationExposed.toLocaleString() },
      ],
      rule: 'Vulnerability index > 0.65',
      confidence: 'High',
      recommendation: 'Activate community outreach and prioritize vulnerable demographics (elderly, outdoor workers).',
      timestamp: new Date().toISOString(),
    });
  }

  return findings;
}
