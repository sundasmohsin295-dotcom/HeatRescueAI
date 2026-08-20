import { useApp } from '@/context/AppContext';
import { Card, Badge, SectionTitle, Button, EmptyState } from '@/components/ui';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  RECOMMENDED: 'var(--text-muted)',
  PENDING_APPROVAL: 'var(--warning)',
  AUTHORIZED: 'var(--info)',
  DISPATCHED: 'var(--accent)',
  COMPLETED: 'var(--success)',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH: 'var(--warning)',
  MEDIUM: 'var(--info)',
  LOW: 'var(--success)',
};

export function ResponseOperations() {
  const { dispatches, authorizeDispatch, advanceDispatch, pushToast } = useApp();

  const handleAuthorize = async (id: string) => {
    const item = dispatches.find((d) => d.id === id);
    if (!item) return;
    if (item.status !== 'PENDING_APPROVAL' && item.status !== 'RECOMMENDED') {
      pushToast('WARNING', 'Cannot authorize.', `Current status: ${item.status}`);
      return;
    }
    await authorizeDispatch(id);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Response Operations" subtitle="Human-in-the-loop dispatch triage" />

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={20} style={{ color: 'var(--warning)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Dispatch Triage Table</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Workflow: RECOMMENDED → PENDING APPROVAL → AUTHORIZED → DISPATCHED → COMPLETED. All dispatches are SIMULATED — no physical resources are deployed.
        </p>

        {dispatches.length === 0 ? (
          <EmptyState message="No dispatches pending." detail="All incidents have been addressed." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Incident</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Zone</th>
                  <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Risk</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Priority</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Recommended Resource</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Personnel</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dispatches.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-2 font-medium" style={{ color: 'var(--text-primary)' }}>{d.incident}</td>
                    <td className="py-3 px-2" style={{ color: 'var(--text-secondary)' }}>{d.zone}</td>
                    <td className="py-3 px-2 text-right font-semibold" style={{ color: d.riskScore > 75 ? 'var(--danger)' : 'var(--warning)' }}>{d.riskScore}</td>
                    <td className="py-3 px-2"><Badge color={PRIORITY_COLORS[d.priority]}>{d.priority}</Badge></td>
                    <td className="py-3 px-2" style={{ color: 'var(--text-secondary)' }}>{d.recommendedResource}</td>
                    <td className="py-3 px-2" style={{ color: 'var(--text-secondary)' }}>{d.personnel}</td>
                    <td className="py-3 px-2"><Badge color={STATUS_COLORS[d.status]}>{d.status.replace(/_/g, ' ')}</Badge></td>
                    <td className="py-3 px-2 text-right">
                      {(d.status === 'PENDING_APPROVAL' || d.status === 'RECOMMENDED') && (
                        <Button size="sm" onClick={() => handleAuthorize(d.id)}>Authorize Dispatch</Button>
                      )}
                      {d.status === 'AUTHORIZED' && (
                        <Button size="sm" variant="secondary" onClick={() => advanceDispatch(d.id)}>Mark Dispatched</Button>
                      )}
                      {d.status === 'DISPATCHED' && (
                        <span className="text-xs flex items-center gap-1 justify-end" style={{ color: 'var(--success)' }}>
                          <CheckCircle size={14} /> Dispatched
                        </span>
                      )}
                      {d.status === 'COMPLETED' && (
                        <span className="text-xs flex items-center gap-1 justify-end" style={{ color: 'var(--success)' }}>
                          <CheckCircle size={14} /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: 'var(--warning)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending Approval</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{dispatches.filter((d) => d.status === 'PENDING_APPROVAL' || d.status === 'RECOMMENDED').length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: 'var(--info)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Authorized</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{dispatches.filter((d) => d.status === 'AUTHORIZED' || d.status === 'DISPATCHED').length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Completed</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{dispatches.filter((d) => d.status === 'COMPLETED').length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
