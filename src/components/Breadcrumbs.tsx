import { useApp, type DomainId } from '@/context/AppContext';
import { ChevronRight, Home } from 'lucide-react';

const DOMAIN_LABELS: Record<DomainId, string> = {
  command: 'Command Center',
  intelligence: 'Heat Intelligence',
  ai: 'AI Investigator',
  simulation: 'Prediction & Simulation',
  response: 'Response Operations',
  cyber: 'Cybersecurity',
  audit: 'Incidents & Audit',
  admin: 'Administration',
};

export function Breadcrumbs() {
  const { activeDomain, selectedZone } = useApp();

  return (
    <div className="flex items-center gap-1.5 text-sm px-6 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>HeatRescue AI</span>
      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{DOMAIN_LABELS[activeDomain]}</span>
      {selectedZone && (
        <>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--accent)' }}>{selectedZone.zoneName}</span>
        </>
      )}
    </div>
  );
}
