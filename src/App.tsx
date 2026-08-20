import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ToastDeck } from '@/components/ToastDeck';
import { CommandCenter } from '@/views/CommandCenter';
import { HeatIntelligence } from '@/views/HeatIntelligence';
import { AIInvestigator } from '@/views/AIInvestigator';
import { SimulationLab } from '@/views/SimulationLab';
import { ResponseOperations } from '@/views/ResponseOperations';
import { Cybersecurity } from '@/views/Cybersecurity';
import { IncidentsAudit } from '@/views/IncidentsAudit';
import { Administration } from '@/views/Administration';

function DomainRouter() {
  const { activeDomain } = useApp();

  switch (activeDomain) {
    case 'command':
      return <CommandCenter />;
    case 'intelligence':
      return <HeatIntelligence />;
    case 'ai':
      return <AIInvestigator />;
    case 'simulation':
      return <SimulationLab />;
    case 'response':
      return <ResponseOperations />;
    case 'cyber':
      return <Cybersecurity />;
    case 'audit':
      return <IncidentsAudit />;
    case 'admin':
      return <Administration />;
    default:
      return <CommandCenter />;
  }
}

function JudgeDemoOverlay() {
  const { judgeDemoRunning, judgeDemoStep, judgeDemoTotal, cancelJudgeDemo } = useApp();

  if (!judgeDemoRunning) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl flex items-center gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: 'var(--shadow)' }}
    >
      <div className="spin w-6 h-6 rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--accent)', borderBottomColor: 'var(--border)' }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Judge Demo Running</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Step {judgeDemoStep}/{judgeDemoTotal}</p>
      </div>
      <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(judgeDemoStep / judgeDemoTotal) * 100}%`, background: 'var(--accent)' }}
        />
      </div>
      <button
        onClick={cancelJudgeDemo}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
      >
        Cancel
      </button>
    </div>
  );
}

function Shell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
        <Breadcrumbs />
        <main className="flex-1 p-6 overflow-x-hidden animate-fade-in">
          <DomainRouter />
        </main>
      </div>
      <ToastDeck />
      <JudgeDemoOverlay />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default App;
