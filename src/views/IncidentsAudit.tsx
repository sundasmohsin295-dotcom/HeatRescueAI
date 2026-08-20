import { useApp } from '@/context/AppContext';
import { Card, Badge, SectionTitle, Button, EmptyState } from '@/components/ui';
import { ScrollText, ShieldCheck, ShieldAlert, Hash } from 'lucide-react';
import { useState } from 'react';

export function IncidentsAudit() {
  const { auditEvents, chainVerification, verifyChain, pushToast, addAuditEvent } = useApp();
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    await verifyChain();
    setVerifying(false);
  };

  const handleGenerateReport = async () => {
    if (auditEvents.length === 0) {
      pushToast('WARNING', 'No audit events to report.', 'Perform actions first to generate audit entries.');
      return;
    }

    const report = [
      'HeatRescue AI — Incident Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Events: ${auditEvents.length}`,
      '',
      ...auditEvents.map((e, i) => 
        `[${i + 1}] ${e.timestamp} | ${e.actor} | ${e.action} | ${e.resource} | ${e.eventType} | Hash: ${e.currentHash.slice(0, 16)}...`
      ),
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatrescue-audit-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    await addAuditEvent('GENERATE_REPORT', `Audit report with ${auditEvents.length} events`, 'REPORT');
    pushToast('SUCCESS', 'Incident report generated.', `${auditEvents.length} events exported to file.`);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Incidents & Audit" subtitle="Cryptographic audit chain — SHA-256 (Web Crypto API)" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Hash size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Chain Status</h3>
          </div>
          {chainVerification ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                {chainVerification.valid ? (
                  <><ShieldCheck size={24} style={{ color: 'var(--success)' }} /><span className="text-lg font-bold" style={{ color: 'var(--success)' }}>VALID</span></>
                ) : (
                  <><ShieldAlert size={24} style={{ color: 'var(--danger)' }} /><span className="text-lg font-bold" style={{ color: 'var(--danger)' }}>COMPROMISED</span></>
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{chainVerification.totalEvents} events verified</p>
              {!chainVerification.valid && chainVerification.reason && (
                <p className="text-xs mt-2 p-2 rounded" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>{chainVerification.reason}</p>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not yet verified. Click "Verify Chain Integrity" to validate.</p>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Actions</h3>
          <div className="space-y-3">
            <Button onClick={handleVerify} disabled={verifying} variant="primary" size="sm">
              {verifying ? 'Verifying...' : 'Verify Chain Integrity'}
            </Button>
            <br />
            <Button onClick={handleGenerateReport} variant="secondary" size="sm">
              Generate Incident Report
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>About This Chain</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Each event's hash is SHA-256(canonicalizedEventData + previousHash). This is a tamper-evident audit chain — not a blockchain. Because it runs in the browser, it is tamper-evident but not truly immutable. A server-side ledger would be authoritative in a production deployment.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ScrollText size={20} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Audit Ledger</h3>
        </div>

        {auditEvents.length === 0 ? (
          <EmptyState message="No audit events recorded." detail="Actions like dispatch authorization, investigations, and security tests will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Timestamp</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Actor</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Action</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Resource</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Hash (first 16)</th>
                </tr>
              </thead>
              <tbody>
                {[...auditEvents].reverse().map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 px-2" style={{ color: 'var(--text-muted)' }}>{auditEvents.length - i}</td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>{e.actor}</td>
                    <td className="py-2 px-2 font-medium" style={{ color: 'var(--text-primary)' }}>{e.action}</td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{e.resource}</td>
                    <td className="py-2 px-2"><Badge color="var(--info)">{e.eventType}</Badge></td>
                    <td className="py-2 px-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{e.currentHash.slice(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
