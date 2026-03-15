import { motion } from 'framer-motion';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';
import { useTypewriter } from '../../hooks/useTypewriter';
import OracleDataViz from './OracleDataViz';
import SageSynthesisViz from './SageSynthesisViz';
import CipherLogicViz from './CipherLogicViz';
import EchoMemoryViz from './EchoMemoryViz';
import NexusNetworkViz from './NexusNetworkViz';
import ForgeCreativeViz from './ForgeCreativeViz';

interface AgentCardProps {
  agentId: string;
}

export default function AgentCard({ agentId }: AgentCardProps) {
  const agentDef = AGENTS.find((a) => a.id === agentId)!;
  const agentState = useSimStore((s) => s.agents[agentId]);
  const focusedAgentId = useSimStore((s) => s.focusedAgentId);
  const lastMessage = useSimStore((s) =>
    s.messages.find((m) => m.fromId === agentId)
  );

  const displayedThought = useTypewriter(agentState?.currentThought ?? '', 20);
  const isFocused = focusedAgentId === agentId;

  if (!agentState) return null;

  const receiverDef = lastMessage
    ? AGENTS.find((a) => a.id === lastMessage.toId)
    : null;

  const handleFocus = () => {
    useSimStore.getState().setFocusedAgent(isFocused ? null : agentId);
  };

  return (
    <motion.div
      className={`agent-card ${isFocused ? 'agent-card-focused' : ''}`}
      onClick={handleFocus}
      style={{
        cursor: 'pointer',
        borderColor: isFocused
          ? agentDef.color
          : agentState.isThinking
          ? agentDef.color
          : 'rgba(100, 160, 255, 0.12)',
        boxShadow: agentState.isThinking
          ? `0 0 15px ${agentDef.color}30, inset 0 0 15px ${agentDef.color}10`
          : 'none',
      }}
      animate={{
        borderColor: agentState.isThinking
          ? [agentDef.color, `${agentDef.color}60`, agentDef.color]
          : 'rgba(100, 160, 255, 0.12)',
      }}
      transition={{ duration: 1.5, repeat: agentState.isThinking ? Infinity : 0 }}
    >
      {/* כותרת */}
      <div className="agent-card-header">
        <div className="agent-card-name">
          <span
            className="agent-dot"
            style={{ backgroundColor: agentDef.color }}
          />
          {agentDef.name}
        </div>
        <div className="agent-confidence-wrapper">
          <span className="agent-confidence-value">
            {agentState.confidence}%
          </span>
          <div className="agent-confidence-bar">
            <motion.div
              className="agent-confidence-fill"
              style={{ backgroundColor: agentDef.color }}
              animate={{ width: `${agentState.confidence}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* תפקיד */}
      <div className="agent-role">{agentDef.role}</div>

      {/* מחשבה נוכחית — כל סוכן עם ויזואליזציה ייחודית */}
      {agentId === 'oracle' ? (
        <OracleDataViz thought={agentState.currentThought} confidence={agentState.confidence} />
      ) : agentId === 'sage' ? (
        <SageSynthesisViz thought={agentState.currentThought} confidence={agentState.confidence} />
      ) : agentId === 'cipher' ? (
        <CipherLogicViz thought={agentState.currentThought} />
      ) : agentId === 'echo' ? (
        <EchoMemoryViz thought={agentState.currentThought} />
      ) : agentId === 'nexus' ? (
        <NexusNetworkViz thought={agentState.currentThought} />
      ) : agentId === 'forge' ? (
        <ForgeCreativeViz thought={agentState.currentThought} />
      ) : (
        <div className="agent-thought">
          {displayedThought ? `"${displayedThought}"` : '...'}
        </div>
      )}

      {/* אינטראקציה אחרונה */}
      {lastMessage && receiverDef && (
        <div className="agent-interaction" style={{ color: agentDef.color }}>
          ← נשלח אל {receiverDef.name}{' '}
          {getTimeAgo(lastMessage.timestamp)}
        </div>
      )}
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return 'עכשיו';
  if (diff < 60) return `לפני ${diff} שנ׳`;
  return `לפני ${Math.floor(diff / 60)} דק׳`;
}
