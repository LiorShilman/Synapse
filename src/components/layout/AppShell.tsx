import { useState, lazy, Suspense } from 'react';
import { AGENTS } from '../../agents/agentDefinitions';
import AgentCard from '../dashboard/AgentCard';
import ThoughtStream from '../dashboard/ThoughtStream';
import ConsensusPanel from '../dashboard/ConsensusPanel';
import ProblemInput from '../dashboard/ProblemInput';
import ResultsSummary from '../dashboard/ResultsSummary';
import SimToolbar from '../dashboard/SimToolbar';
import StatusBar from './StatusBar';
import ErrorBoundary from './ErrorBoundary';
import ConsensusExplosion from '../events/ConsensusExplosion';
import GuidePage from '../guide/GuidePage';
import ApiSettingsModal from '../settings/ApiSettingsModal';

const AgentNetwork3D = lazy(() => import('../network/AgentNetwork3D'));
const LearningChart = lazy(() => import('../dashboard/LearningChart'));

function LazyFallback() {
  return <div className="lazy-fallback">טוען...</div>;
}

export default function AppShell() {
  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="app-shell">
      <StatusBar onOpenGuide={() => setShowGuide(true)} onOpenSettings={() => setShowSettings(true)} />
      <div className="main-content">
        {/* Problem Input — separate element for mobile reordering */}
        <div className="input-panel">
          <ProblemInput />
        </div>

        {/* 3D Network */}
        <div className="network-panel">
          <ErrorBoundary>
            <Suspense fallback={<LazyFallback />}>
              <AgentNetwork3D />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Thought Stream + Consensus/Results at bottom */}
        <div className="stream-panel">
          <ThoughtStream />
          <ConsensusPanel />
          <SimToolbar />
          <ResultsSummary />
        </div>

        {/* Dashboard — cards, chart */}
        <div className="dashboard-panel">
          <div className="agent-cards-grid">
            {AGENTS.map((agent) => (
              <AgentCard key={agent.id} agentId={agent.id} />
            ))}
          </div>

          <ErrorBoundary>
            <Suspense fallback={<LazyFallback />}>
              <LearningChart />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      <ConsensusExplosion />

      {showGuide && <GuidePage onClose={() => setShowGuide(false)} />}
      {showSettings && <ApiSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
