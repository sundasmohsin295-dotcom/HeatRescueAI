import { useApp } from '@/context/AppContext';
import { Card, Badge, SectionTitle, EmptyState, Button } from '@/components/ui';
import { generateFindings, type AIFinding } from '@/lib/dataService';
import { Brain, ShieldCheck, FileSearch, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { sanitizePrompt, type PromptThreat } from '@/lib/security';

export function AIInvestigator() {
  const { zones, selectedZone, selectedZoneRisk, selectZone, pushToast, addAuditEvent } = useApp();
  const [investigationInput, setInvestigationInput] = useState('');
  const [threats, setThreats] = useState<PromptThreat[]>([]);
  const [findings, setFindings] = useState<AIFinding[]>([]);
  const [investigated, setInvestigated] = useState(false);

  const handleInvestigate = async () => {
    if (!selectedZone || !selectedZoneRisk) {
      pushToast('WARNING', 'Select a zone first.', 'Choose a zone from the Command Center or Heat Intelligence.');
      return;
    }

    const { sanitized, threats: detected } = sanitizePrompt(investigationInput);
    setThreats(detected);

    if (detected.some((t) => t.level === 'HIGH')) {
      pushToast('SECURITY', 'HIGH threat detected in input.', 'Prompt sanitized. Investigation blocked due to suspicious instructions.');
      await addAuditEvent('PROMPT_INJECTION_BLOCKED', `Input contained: ${detected.map((t) => t.matchedText).join(', ')}`, 'SECURITY');
      return;
    }

    if (sanitized && detected.length > 0) {
      pushToast('WARNING', `${detected.length} suspicious pattern(s) detected.`, 'Input sanitized before processing.');
    }

    const generated = generateFindings(selectedZone, selectedZoneRisk);
    setFindings(generated);
    setInvestigated(true);
    await addAuditEvent('CREATE_INVESTIGATION', `Zone: ${selectedZone.zoneName}, Findings: ${generated.length}`, 'INVESTIGATION');
    pushToast('SUCCESS', 'Investigation complete.', `${generated.length} findings generated from validated sensor data.`);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="AI Investigator" subtitle="Explainable, deterministic chain-of-thought diagnostics" />

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Investigation Input</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          The AI layer interprets structured evidence produced by the deterministic risk engine. It does not invent facts. All findings link directly to sensor metrics.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedZone?.zoneId ?? ''}
            onChange={(e) => selectZone(e.target.value || null)}
            className="px-3 py-2 rounded-lg text-sm flex-shrink-0"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            <option value="">Select a zone...</option>
            {zones.map((z) => (
              <option key={z.zoneId} value={z.zoneId}>{z.zoneName} ({z.temperature}°C)</option>
            ))}
          </select>
          <input
            type="text"
            value={investigationInput}
            onChange={(e) => setInvestigationInput(e.target.value)}
            placeholder="Optional: Ask a question about this zone..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          />
          <Button onClick={handleInvestigate}>Investigate</Button>
        </div>
        {threats.length > 0 && (
          <div className="mt-3 space-y-1">
            {threats.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge color={t.level === 'HIGH' ? 'var(--danger)' : 'var(--warning)'}>{t.level}</Badge>
                <span style={{ color: 'var(--text-secondary)' }}>Detected: "{t.matchedText}"</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!investigated && !findings.length && (
        <Card>
          <EmptyState message="No investigation yet." detail="Select a zone and click Investigate to generate an explainable evidence trace." />
        </Card>
      )}

      {findings.length > 0 && (
        <div className="space-y-4">
          {findings.map((f, i) => (
            <Card key={i}>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 mt-1">
                  <FileSearch size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Finding {i + 1}</h4>
                    <Badge color={f.confidence === 'High' ? 'var(--success)' : 'var(--warning)'}>Confidence: {f.confidence}</Badge>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>{f.finding}</p>
                </div>
              </div>

              <div className="ml-8 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Evidence</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {f.evidence.map((ev, j) => (
                      <div key={j} className="px-3 py-2 rounded-lg" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ev.label}</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Rule</p>
                  <p className="text-sm font-mono px-3 py-2 rounded-lg" style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>{f.rule}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Recommendation</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{f.recommendation}</p>
                </div>

                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Timestamp: {new Date(f.timestamp).toLocaleString()}</p>
              </div>
            </Card>
          ))}

          <Card>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                All findings derived from validated sensor data via the canonical risk engine. Zero hallucinations — every metric is traceable to a source reading.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
