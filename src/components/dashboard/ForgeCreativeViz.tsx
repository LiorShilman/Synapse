import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { useTypewriter } from '../../hooks/useTypewriter';

interface ForgeCreativeVizProps {
  thought: string;
}

function getForgePhase(thought: string): { text: string; color: string } {
  if (thought.includes('מוכנה') || thought.includes('נוצר') || thought.includes('הסופית'))
    return { text: 'FORGED', color: '#66BB6A' };
  if (thought.includes('מתגבש') || thought.includes('אב-טיפוס') || thought.includes('מתגלה'))
    return { text: 'SHAPING', color: '#FF7043' };
  if (thought.includes('שביר') || thought.includes('יקר') || thought.includes('פשרה'))
    return { text: 'STRESS TEST', color: '#EF5350' };
  if (thought.includes('מסגרת') || thought.includes('ארכיטקטוני') || thought.includes('פירוק'))
    return { text: 'BLUEPRINT', color: '#4FC3F7' };
  if (thought.includes('היברידי') || thought.includes('מיזוג') || thought.includes('שילוב'))
    return { text: 'FUSION', color: '#B39DDB' };
  return { text: 'CRAFTING', color: '#FF7043' };
}

// Heat level from thought content
function getHeatLevel(thought: string): number {
  let heat = 40;
  if (thought.includes('פריצת דרך') || thought.includes('חדשה')) heat += 25;
  if (thought.includes('מוכנה') || thought.includes('הסופית') || thought.includes('נוצר')) heat += 20;
  if (thought.includes('מתגבש') || thought.includes('אב-טיפוס')) heat += 15;
  if (thought.includes('שילוב') || thought.includes('היברידי')) heat += 10;
  if (thought.includes('שביר') || thought.includes('יקר')) heat -= 10;
  return Math.min(100, Math.max(10, heat));
}

export default function ForgeCreativeViz({ thought }: ForgeCreativeVizProps) {
  const messages = useSimStore((s) => s.messages);
  const phase = useMemo(() => getForgePhase(thought), [thought]);
  const heat = useMemo(() => getHeatLevel(thought), [thought]);
  const displayedThought = useTypewriter(thought, 20);

  // Forge stats
  const forgeMessages = messages.filter((m) => m.fromId === 'forge');
  const solutionsCreated = forgeMessages.filter((m) =>
    m.text.includes('פתרון') || m.text.includes('מוכנה') || m.text.includes('נוצר') || m.text.includes('תוכנית')
  ).length;
  const prototypes = forgeMessages.filter((m) =>
    m.text.includes('אב-טיפוס') || m.text.includes('מסגרת') || m.text.includes('ארכיטקטוני')
  ).length;

  // Heat color gradient
  const heatColor = heat >= 75 ? '#EF5350' : heat >= 50 ? '#FF7043' : '#4FC3F7';

  if (!thought) return <div className="agent-thought">...</div>;

  return (
    <div className="forge-viz">
      {/* Phase */}
      <div className="forge-phase-row">
        <motion.span
          className="forge-phase-badge"
          style={{ '--agent-color': phase.color, borderColor: `${phase.color}40` } as React.CSSProperties}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="forge-phase-dot bg-agent" style={{ '--agent-color': phase.color } as React.CSSProperties} />
          {phase.text}
        </motion.span>
        <span className="forge-engine-tag">CREATIVE FORGE</span>
      </div>

      {/* Heat gauge — flame-style segmented bar */}
      <div className="forge-heat">
        <div className="forge-heat-label">
          <span>FORGE HEAT</span>
          <span className="text-agent" style={{ '--agent-color': heatColor } as React.CSSProperties}>{heat}%</span>
        </div>
        <div className="forge-heat-track">
          {Array.from({ length: 15 }).map((_, i) => {
            const threshold = ((i + 1) / 15) * 100;
            const active = heat >= threshold;
            const segColor = threshold <= 33 ? '#4FC3F7' : threshold <= 66 ? '#FF7043' : '#EF5350';
            return (
              <motion.div
                key={i}
                className="forge-heat-segment"
                style={{
                  backgroundColor: active ? segColor : 'rgba(100,160,255,0.08)',
                  opacity: active ? 1 : 0.3,
                }}
                animate={active && i > 8 ? { opacity: [0.6, 1, 0.6] } : {}}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
              />
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="forge-stats">
        <div className="forge-stat">
          <span className="forge-stat-value text-green">{solutionsCreated}</span>
          <span className="forge-stat-label">פתרונות</span>
        </div>
        <div className="forge-stat">
          <span className="forge-stat-value text-orange">{prototypes}</span>
          <span className="forge-stat-label">טיוטות</span>
        </div>
        <div className="forge-stat">
          <span className="forge-stat-value text-cyan">{forgeMessages.length}</span>
          <span className="forge-stat-label">יצירות</span>
        </div>
      </div>

      {/* Thought */}
      <div className="forge-thought-text">{displayedThought}</div>
    </div>
  );
}
