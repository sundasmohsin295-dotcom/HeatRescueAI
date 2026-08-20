export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  eventType: string;
  previousHash: string;
  currentHash: string;
}

const STORAGE_KEY = 'heatrescue-audit-chain';

function canonicalize(event: Omit<AuditEvent, 'currentHash' | 'previousHash'>): string {
  return [
    event.id,
    event.timestamp,
    event.actor,
    event.action,
    event.resource,
    event.eventType,
  ]
    .join('|');
}

export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function loadChain(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditEvent[];
  } catch {
    return [];
  }
}

function saveChain(chain: AuditEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chain));
}

export async function appendAuditEvent(
  actor: string,
  action: string,
  resource: string,
  eventType: string,
): Promise<AuditEvent> {
  const chain = loadChain();
  const previousHash = chain.length > 0 ? chain[chain.length - 1].currentHash : 'GENESIS';
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  const event: Omit<AuditEvent, 'currentHash'> = {
    id,
    timestamp,
    actor,
    action,
    resource,
    eventType,
    previousHash,
  };
  const currentHash = await sha256(canonicalize(event) + previousHash);
  const fullEvent: AuditEvent = { ...event, currentHash };
  chain.push(fullEvent);
  saveChain(chain);
  return fullEvent;
}

export interface ChainVerification {
  valid: boolean;
  brokenEventId?: string;
  brokenIndex?: number;
  reason?: string;
  totalEvents: number;
}

export async function verifyChainIntegrity(): Promise<ChainVerification> {
  const chain = loadChain();
  if (chain.length === 0) {
    return { valid: true, totalEvents: 0 };
  }

  for (let i = 0; i < chain.length; i++) {
    const event = chain[i];
    const expectedPrev = i === 0 ? 'GENESIS' : chain[i - 1].currentHash;
    if (event.previousHash !== expectedPrev) {
      return {
        valid: false,
        brokenEventId: event.id,
        brokenIndex: i,
        reason: `Hash link broken at event ${i + 1}: previousHash does not match prior event's currentHash.`,
        totalEvents: chain.length,
      };
    }
    const { currentHash, ...rest } = event;
    void currentHash;
    const recalculated = await sha256(canonicalize(rest) + event.previousHash);
    if (recalculated !== event.currentHash) {
      return {
        valid: false,
        brokenEventId: event.id,
        brokenIndex: i,
        reason: `Event ${i + 1} content has been modified (hash mismatch).`,
        totalEvents: chain.length,
      };
    }
  }

  return { valid: true, totalEvents: chain.length };
}

export function clearChain(): void {
  localStorage.removeItem(STORAGE_KEY);
}
