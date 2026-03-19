import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSimStore } from '../../store/useSimStore';

interface CipherLogicVizProps {
  thought: string;
}

interface LogicCheck {
  label: string;
  status: 'pass' | 'fail' | 'pending';
}

function getVerificationStatus(thought: string): { text: string; color: string } {
  if (thought.includes('הושלם') || thought.includes('אומתו') || thought.includes('מאשר') || thought.includes('תקינה'))
    return { text: 'VERIFIED', color: '#66BB6A' };
  if (thought.includes('עצור') || thought.includes('חוסר עקביות') || thought.includes('נכשל') || thought.includes('פגיעויות'))
    return { text: 'VIOLATION', color: '#EF9A9A' };
  if (thought.includes('אתגר') || thought.includes('אזהרה') || thought.includes('פרקליט'))
    return { text: 'CHALLENGE', color: '#FFAB40' };
  if (thought.includes('סריקת') || thought.includes('בדיקת') || thought.includes('ביקורת'))
    return { text: 'SCANNING', color: '#4FC3F7' };
  return { text: 'VALIDATING', color: '#EF9A9A' };
}

function extractChecks(thought: string): LogicCheck[] {
  const checks: LogicCheck[] = [];

  // Logic consistency
  if (thought.includes('עקביות') || thought.includes('לוגי') || thought.includes('שרשרת'))
    checks.push({ label: 'עקביות לוגית', status: thought.includes('חוסר') || thought.includes('סותר') ? 'fail' : 'pass' });
  else
    checks.push({ label: 'עקביות לוגית', status: 'pending' });

  // Assumptions
  if (thought.includes('הנחה') || thought.includes('מניח'))
    checks.push({ label: 'בדיקת הנחות', status: thought.includes('לא נבדקה') || thought.includes('שלא') ? 'fail' : 'pass' });
  else
    checks.push({ label: 'בדיקת הנחות', status: 'pending' });

  // Edge cases
  if (thought.includes('קצה') || thought.includes('יריבותי') || thought.includes('לחץ') || thought.includes('מבחן'))
    checks.push({ label: 'מקרי קצה', status: thought.includes('נכשל') || thought.includes('חורג') ? 'fail' : 'pass' });
  else
    checks.push({ label: 'מקרי קצה', status: 'pending' });

  // Robustness
  if (thought.includes('עמידות') || thought.includes('עמיד') || thought.includes('אבטחה'))
    checks.push({ label: 'עמידות', status: thought.includes('פגיע') || thought.includes('ניצל') ? 'fail' : 'pass' });
  else
    checks.push({ label: 'עמידות', status: 'pending' });

  return checks;
}

export default function CipherLogicViz({ thought }: CipherLogicVizProps) {
  const messages = useSimStore((s) => s.messages);
  const status = useMemo(() => getVerificationStatus(thought), [thought]);
  const checks = useMemo(() => extractChecks(thought), [thought]);

  // Count cipher's verifications from message history
  const cipherMessages = messages.filter((m) => m.fromId === 'cipher');
  const verified = cipherMessages.filter((m) =>
    m.text.includes('הושלם') || m.text.includes('אומתו') || m.text.includes('תקינה') || m.text.includes('מאשר')
  ).length;
  const flagged = cipherMessages.filter((m) =>
    m.text.includes('עצור') || m.text.includes('אזהרה') || m.text.includes('חוסר') || m.text.includes('נכשל')
  ).length;

  if (!thought) return <div className="agent-thought">...</div>;

  return (
    <div className="cipher-viz">
      {/* Status */}
      <div className="cipher-status-row">
        <motion.span
          className="cipher-status-badge"
          style={{ '--agent-color': status.color, borderColor: `${status.color}40` } as React.CSSProperties}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="cipher-status-dot bg-agent" style={{ '--agent-color': status.color } as React.CSSProperties} />
          {status.text}
        </motion.span>
        <span className="cipher-engine-tag">LOGIC GATE</span>
      </div>

      {/* Logic checks */}
      <div className="cipher-checks">
        {checks.map((check, i) => {
          const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '○';
          const colorClass = check.status === 'pass' ? 'text-green' : check.status === 'fail' ? 'text-red' : 'text-muted';
          return (
            <motion.div
              key={check.label}
              className="cipher-check-item"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.2 }}
            >
              <span className={`cipher-check-icon ${colorClass}`}>{icon}</span>
              <span className="cipher-check-label">{check.label}</span>
              <span className={`cipher-check-status ${colorClass}`}>
                {check.status === 'pass' ? 'PASS' : check.status === 'fail' ? 'FAIL' : '...'}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Counters */}
      <div className="cipher-counters">
        <div className="cipher-counter">
          <span className="cipher-counter-value text-green">{verified}</span>
          <span className="cipher-counter-label">אומתו</span>
        </div>
        <div className="cipher-counter">
          <span className="cipher-counter-value text-red">{flagged}</span>
          <span className="cipher-counter-label">סומנו</span>
        </div>
        <div className="cipher-counter">
          <span className="cipher-counter-value text-cyan">{cipherMessages.length}</span>
          <span className="cipher-counter-label">סריקות</span>
        </div>
      </div>

      {/* Thought */}
      <div className="cipher-thought-text">{thought}</div>
    </div>
  );
}
