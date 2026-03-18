import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';

interface NexusNetworkVizProps {
  thought: string;
}

function getNexusPhase(thought: string): { text: string; color: string } {
  if (thought.includes('מסונכרנים') || thought.includes('קוהרנטיות') || thought.includes('קונצנזוס'))
    return { text: 'SYNCED', color: '#66BB6A' };
  if (thought.includes('פער') || thought.includes('סילו') || thought.includes('השהיה'))
    return { text: 'DISRUPTION', color: '#EF9A9A' };
  if (thought.includes('ניתוב') || thought.includes('עדכון') || thought.includes('מבקש'))
    return { text: 'ROUTING', color: '#4FC3F7' };
  if (thought.includes('התאמה') || thought.includes('קורלציה') || thought.includes('מתכנסים'))
    return { text: 'CONVERGING', color: '#FFD54F' };
  return { text: 'MONITORING', color: '#CE93D8' };
}

// Simple 2D positions for 5 nodes (pentagon) — excluding nexus itself
const NODE_POSITIONS: [number, number][] = [
  [50, 8],   // top
  [88, 38],  // top-right
  [75, 78],  // bottom-right
  [25, 78],  // bottom-left
  [12, 38],  // top-left
];

export default function NexusNetworkViz({ thought }: NexusNetworkVizProps) {
  const messages = useSimStore((s) => s.messages);
  const activeEdges = useSimStore((s) => s.activeEdges);
  const phase = useMemo(() => getNexusPhase(thought), [thought]);

  const otherAgents = AGENTS.filter((a) => a.id !== 'nexus');

  // Build connection activity map
  const connectionMap = useMemo(() => {
    const map: Record<string, number> = {};
    // Count recent messages between agent pairs (last 20 messages)
    const recent = messages.slice(0, 20);
    for (const msg of recent) {
      const key = [msg.fromId, msg.toId].sort().join('-');
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [messages]);

  // Active connections set
  const activeSet = useMemo(() => {
    const set = new Set<string>();
    for (const edge of activeEdges) {
      set.add([edge.fromId, edge.toId].sort().join('-'));
    }
    return set;
  }, [activeEdges]);

  // Network clarity — how many unique agent pairs communicated recently
  const totalPairs = 15; // C(6,2)
  const activePairs = Object.keys(connectionMap).length;
  const networkClarity = Math.round((activePairs / totalPairs) * 100);

  if (!thought) return <div className="agent-thought">...</div>;

  return (
    <div className="nexus-viz">
      {/* Phase */}
      <div className="nexus-phase-row">
        <motion.span
          className="nexus-phase-badge"
          style={{ color: phase.color, borderColor: `${phase.color}40` }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="nexus-phase-dot" style={{ backgroundColor: phase.color }} />
          {phase.text}
        </motion.span>
        <span className="nexus-engine-tag">NETWORK HUB</span>
      </div>

      {/* Mini network graph */}
      <div className="nexus-graph">
        <svg viewBox="0 0 100 86" className="nexus-svg">
          {/* Connection lines between nodes */}
          {otherAgents.map((a, i) =>
            otherAgents.slice(i + 1).map((b, j) => {
              const key = [a.id, b.id].sort().join('-');
              const isActive = activeSet.has(key);
              const activity = connectionMap[key] || 0;
              const posA = NODE_POSITIONS[i];
              const posB = NODE_POSITIONS[i + j + 1];
              const opacity = isActive ? 0.8 : activity > 0 ? 0.15 + Math.min(activity * 0.1, 0.3) : 0.06;
              const stroke = isActive ? '#CE93D8' : '#4A6A8A';
              return (
                <motion.line
                  key={key}
                  x1={posA[0]} y1={posA[1]}
                  x2={posB[0]} y2={posB[1]}
                  stroke={stroke}
                  strokeWidth={isActive ? 1.5 : 0.5}
                  opacity={opacity}
                  animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              );
            })
          )}
          {/* Agent nodes */}
          {otherAgents.map((a, i) => {
            const [cx, cy] = NODE_POSITIONS[i];
            const isActive = activeEdges.some((e) => e.fromId === a.id || e.toId === a.id);
            return (
              <g key={a.id}>
                <motion.circle
                  cx={cx} cy={cy} r={isActive ? 5 : 3.5}
                  fill={a.color}
                  opacity={isActive ? 1 : 0.6}
                  animate={isActive ? { scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <text
                  x={cx} y={cy + 11}
                  textAnchor="middle"
                  fill="#4A6A8A"
                  fontSize="5"
                  fontFamily="var(--font-mono)"
                >
                  {a.name.slice(0, 4)}
                </text>
              </g>
            );
          })}
          {/* Nexus center point */}
          <motion.circle
            cx={50} cy={43} r={4}
            fill="#CE93D8"
            opacity={0.8}
            animate={{ scale: [0.75, 1.1, 0.75], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </div>

      {/* Network clarity bar */}
      <div className="nexus-clarity">
        <div className="nexus-clarity-label">
          <span>NETWORK CLARITY</span>
          <span style={{ color: networkClarity >= 60 ? '#66BB6A' : '#CE93D8' }}>{networkClarity}%</span>
        </div>
        <div className="nexus-clarity-track">
          <motion.div
            className="nexus-clarity-fill"
            animate={{ width: `${networkClarity}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Thought */}
      <div className="nexus-thought-text">{thought}</div>
    </div>
  );
}
