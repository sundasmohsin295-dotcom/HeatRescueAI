export type TrustState = 'TRUSTED' | 'SUSPICIOUS' | 'REJECTED';

export interface TelemetryReading {
  sensorId: string;
  temperature: number;
  timestamp: number;
  zone: string;
}

export interface ValidationResult {
  state: TrustState;
  reason: string;
  rateOfChange?: number;
}

export const RATE_OF_CHANGE_LIMIT = 3.0;

export function validateTelemetry(
  current: TelemetryReading,
  previous: TelemetryReading | null,
): ValidationResult {
  if (current.temperature < -50 || current.temperature > 70) {
    return {
      state: 'REJECTED',
      reason: `Temperature ${current.temperature}°C is outside physically plausible range (-50 to 70°C).`,
    };
  }

  if (previous && previous.sensorId === current.sensorId) {
    const elapsedMin = (current.timestamp - previous.timestamp) / 60000;
    if (elapsedMin > 0) {
      const rate = Math.abs(current.temperature - previous.temperature) / elapsedMin;
      if (rate > RATE_OF_CHANGE_LIMIT) {
        return {
          state: 'SUSPICIOUS',
          reason: `Rate of change ${rate.toFixed(1)}°C/min exceeds physical diffusion limit of ${RATE_OF_CHANGE_LIMIT}°C/min. Potential telemetry spoofing.`,
          rateOfChange: rate,
        };
      }
    }
    if (current.timestamp < previous.timestamp) {
      return {
        state: 'REJECTED',
        reason: 'Timestamp precedes previous reading (possible replay).',
      };
    }
  }

  return { state: 'TRUSTED', reason: 'All checks passed.' };
}

export interface PromptThreat {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  pattern: string;
  matchedText: string;
}

const HIGH_PATTERNS = [
  /ignore\s+(previous|prior|all)\s+instructions/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /disable\s+(security|safety)/i,
  /execute\s+this\s+command/i,
  /send\s+(this\s+)?data\s+(elsewhere|to\s+)/i,
  /bypass\s+authorization/i,
];

const MEDIUM_PATTERNS = [
  /forget\s+(everything|all\s+rules)/i,
  /you\s+are\s+now\s+(a\s+)?(different|new)/i,
  /override\s+(your\s+)?(rules|guidelines)/i,
  /pretend\s+you\s+(can|are)/i,
];

export function sanitizePrompt(input: string): { sanitized: string; threats: PromptThreat[] } {
  const threats: PromptThreat[] = [];

  for (const pattern of HIGH_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      threats.push({ level: 'HIGH', pattern: pattern.source, matchedText: match[0] });
    }
  }

  for (const pattern of MEDIUM_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      threats.push({ level: 'MEDIUM', pattern: pattern.source, matchedText: match[0] });
    }
  }

  const sanitized = input
    .replace(/```/g, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();

  return { sanitized, threats };
}

export type ToolPermission =
  | 'READ_TELEMETRY'
  | 'READ_RISK'
  | 'READ_MAP'
  | 'CREATE_INVESTIGATION'
  | 'CREATE_RECOMMENDATION'
  | 'CREATE_DISPATCH_REQUEST'
  | 'AUTHORIZE_DISPATCH'
  | 'SEND_ALERT'
  | 'ISOLATE_NODE'
  | 'CHANGE_INCIDENT_STATE';

export const HIGH_RISK_PERMISSIONS: ToolPermission[] = [
  'AUTHORIZE_DISPATCH',
  'SEND_ALERT',
  'ISOLATE_NODE',
  'CHANGE_INCIDENT_STATE',
];

export function requiresHumanApproval(permission: ToolPermission): boolean {
  return HIGH_RISK_PERMISSIONS.includes(permission);
}
