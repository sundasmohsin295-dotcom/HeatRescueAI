export interface RiskInput {
  temperature: number;
  baseline: number;
  persistenceHours: number;
  threshold: number;
  solarFlux?: number;
  vulnerabilityIndex?: number;
  populationExposed?: number;
  dataQuality: number;
}

export interface RiskContributor {
  factor: string;
  contribution: number;
  detail: string;
}

export interface RiskResult {
  score: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  contributors: RiskContributor[];
  confidence: number;
  dataQuality: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  timestamp: string;
  methodology: string;
}

export function calculateHeatRisk(input: RiskInput): RiskResult {
  const contributors: RiskContributor[] = [];
  let score = 0;

  const anomaly = input.temperature - input.baseline;
  const anomalyContribution = Math.min(30, Math.max(0, anomaly * 5));
  score += anomalyContribution;
  contributors.push({
    factor: 'Temperature Anomaly',
    contribution: Math.round(anomalyContribution),
    detail: `${input.temperature}°C vs baseline ${input.baseline}°C (Δ${anomaly > 0 ? '+' : ''}${anomaly.toFixed(1)}°C)`,
  });

  const persistenceContribution = Math.min(20, Math.max(0, input.persistenceHours * 4));
  score += persistenceContribution;
  contributors.push({
    factor: 'Persistence',
    contribution: Math.round(persistenceContribution),
    detail: `${input.persistenceHours.toFixed(1)} hours above ${input.threshold}°C`,
  });

  const exceedance = input.temperature - input.threshold;
  const exceedanceContribution = Math.min(20, Math.max(0, exceedance * 3));
  score += exceedanceContribution;
  contributors.push({
    factor: 'Threshold Exceedance',
    contribution: Math.round(exceedanceContribution),
    detail: `${input.temperature}°C vs threshold ${input.threshold}°C`,
  });

  if (input.solarFlux !== undefined) {
    const fluxContribution = Math.min(15, Math.max(0, (input.solarFlux - 400) / 50));
    score += fluxContribution;
    contributors.push({
      factor: 'Solar Flux',
      contribution: Math.round(fluxContribution),
      detail: `${input.solarFlux} W/m²`,
    });
  }

  if (input.vulnerabilityIndex !== undefined) {
    const vulnContribution = Math.min(15, input.vulnerabilityIndex * 15);
    score += vulnContribution;
    contributors.push({
      factor: 'Vulnerability',
      contribution: Math.round(vulnContribution),
      detail: `Index ${input.vulnerabilityIndex.toFixed(2)}`,
    });
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let severity: RiskResult['severity'];
  if (score >= 80) severity = 'EXTREME';
  else if (score >= 60) severity = 'HIGH';
  else if (score >= 35) severity = 'MODERATE';
  else severity = 'LOW';

  const confidence = Math.min(95, Math.max(30, Math.round(40 + input.dataQuality * 55)));

  let dataQuality: RiskResult['dataQuality'];
  if (input.dataQuality >= 0.85) dataQuality = 'EXCELLENT';
  else if (input.dataQuality >= 0.65) dataQuality = 'GOOD';
  else if (input.dataQuality >= 0.4) dataQuality = 'FAIR';
  else dataQuality = 'POOR';

  return {
    score,
    severity,
    contributors,
    confidence,
    dataQuality,
    timestamp: new Date().toISOString(),
    methodology:
      'Weighted additive model: anomaly (30) + persistence (20) + exceedance (20) + solar flux (15) + vulnerability (15), clamped 0–100.',
  };
}

export function severityColor(severity: RiskResult['severity']): string {
  switch (severity) {
    case 'EXTREME':
      return 'var(--danger)';
    case 'HIGH':
      return 'var(--warning)';
    case 'MODERATE':
      return 'var(--info)';
    case 'LOW':
      return 'var(--success)';
  }
}
