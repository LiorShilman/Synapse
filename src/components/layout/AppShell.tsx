import { useState } from 'react';
import { AGENTS } from '../../agents/agentDefinitions';
import AgentNetwork3D from '../network/AgentNetwork3D';
import AgentCard from '../dashboard/AgentCard';
import ThoughtStream from '../dashboard/ThoughtStream';
import LearningChart from '../dashboard/LearningChart';
import ConsensusPanel from '../dashboard/ConsensusPanel';
import ProblemInput from '../dashboard/ProblemInput';
import ResultsSummary from '../dashboard/ResultsSummary';
import StatusBar from './StatusBar';
import ConsensusExplosion from '../events/ConsensusExplosion';
import GuidePage from '../guide/GuidePage';

export default function AppShell() {
  const [showGuide, setShowGuide] = useState(false);

  if (showGuide) {
    return <GuidePage onClose={() => setShowGuide(false)} />;
  }

  return (
    <div className="app-shell">
      <StatusBar onOpenGuide={() => setShowGuide(true)} />
      <div className="main-content">
        {/* 3D Network */}
        <div className="network-panel">
          <AgentNetwork3D />
        </div>

        {/* Thought Stream — full-height middle column */}
        <div className="stream-panel">
          <ThoughtStream />
        </div>

        {/* Dashboard — input, cards, chart, consensus, results */}
        <div className="dashboard-panel">
          <ProblemInput />

          <div className="agent-cards-grid">
            {AGENTS.map((agent) => (
              <AgentCard key={agent.id} agentId={agent.id} />
            ))}
          </div>

          <LearningChart />

          <ConsensusPanel />

          <ResultsSummary />
        </div>
      </div>

      <ConsensusExplosion />
    </div>
  );
}
