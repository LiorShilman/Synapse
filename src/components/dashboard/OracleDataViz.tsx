import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';

interface OracleDataVizProps {
  thought: string;
  confidence: number;
}

interface ExtractedMetric {
  label: string;
  value: number;
  suffix: string;
  color: string;
}

// Extract numerical data from Oracle's thought text
function extractMetrics(thought: string): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = [];

  // Match percentages like "87%", "{confidence}%" patterns
  const pctMatches = thought.match(/(\d{1,3})%/g);
  if (pctMatches) {
    for (const m of pctMatches) {
      const val = parseInt(m);
      const color = val >= 75 ? '#66BB6A' : val >= 50 ? '#FFEE58' : '#EF5350';
      // Try to find a label before the number
      const idx = thought.indexOf(m);
      const before = thought.slice(Math.max(0, idx - 30), idx).trim();
      let label = 'הסתברות';
      if (before.includes('אמינות')) label = 'אמינות';
      else if (before.includes('ביטחון') || before.includes('רווח')) label = 'רווח ביטחון';
      else if (before.includes('התכנסות')) label = 'התכנסות';
      else if (before.includes('סטייה')) label = 'סטייה';
      else if (before.includes('בהירות') || before.includes('אות')) label = 'עוצמת אות';
      else if (before.includes('קורלציה')) label = 'קורלציה';
      else if (before.includes('פוסטריורית')) label = 'הסתברות פוסטריורית';
      metrics.push({ label, value: val, suffix: '%', color });
    }
  }

  // Match R² values like "R² = 0.94"
  const r2Match = thought.match(/R²\s*=\s*([\d.]+)/);
  if (r2Match) {
    const val = parseFloat(r2Match[1]);
    metrics.push({
      label: 'R²',
      value: Math.round(val * 100),
      suffix: '',
      color: val >= 0.8 ? '#66BB6A' : val >= 0.5 ? '#FFEE58' : '#EF5350',
    });
  }

  // Match "אחוזון ה-XX" patterns
  const percentileMatch = thought.match(/אחוזון\s*ה[--](\d+)/);
  if (percentileMatch) {
    metrics.push({
      label: 'אחוזון',
      value: parseInt(percentileMatch[1]),
      suffix: '',
      color: '#4FC3F7',
    });
  }

  return metrics;
}

// Determine a status label from thought content
function getAnalysisStatus(thought: string): { text: string; color: string } {
  const lower = thought.toLowerCase();
  if (lower.includes('אזהרה') || lower.includes('סיכון') || lower.includes('התאמת-יתר'))
    return { text: 'ALERT', color: '#EF5350' };
  if (lower.includes('מאשר') || lower.includes('הושלם') || lower.includes('מיושרים') || lower.includes('מתכנס'))
    return { text: 'CONFIRMED', color: '#66BB6A' };
  if (lower.includes('סימולציה') || lower.includes('ניתוח') || lower.includes('פירוק'))
    return { text: 'PROCESSING', color: '#4FC3F7' };
  if (lower.includes('שאלה') || lower.includes('האם'))
    return { text: 'QUERY', color: '#B39DDB' };
  return { text: 'ANALYZING', color: '#4FC3F7' };
}

export default function OracleDataViz({ thought, confidence }: OracleDataVizProps) {
  const metrics = useMemo(() => extractMetrics(thought), [thought]);
  const status = useMemo(() => getAnalysisStatus(thought), [thought]);
  const displayedThought = useTypewriter(thought, 20);

  if (!thought) return <div className="agent-thought">...</div>;

  return (
    <div className="oracle-viz">
      {/* Status indicator */}
      <div className="oracle-status-row">
        <motion.span
          className="oracle-status-badge"
          style={{ '--agent-color': status.color, borderColor: `${status.color}40` } as React.CSSProperties}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="oracle-status-dot bg-agent" style={{ '--agent-color': status.color } as React.CSSProperties} />
          {status.text}
        </motion.span>
        <span className="oracle-model-tag">BAYESIAN ENGINE</span>
      </div>

      {/* Metrics grid */}
      {metrics.length > 0 && (
        <div className="oracle-metrics">
          {metrics.map((m, i) => (
            <motion.div
              key={`${m.label}-${i}`}
              className="oracle-metric"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <div className="oracle-metric-label">{m.label}</div>
              <div className="oracle-metric-value text-agent" style={{ '--agent-color': m.color } as React.CSSProperties}>
                {m.suffix === '%' ? m.value : m.value / 100}
                <span className="oracle-metric-suffix">{m.suffix}</span>
              </div>
              <div className="oracle-metric-bar-bg">
                <motion.div
                  className="oracle-metric-bar-fill bg-agent"
                  style={{ '--agent-color': m.color } as React.CSSProperties}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confidence gauge */}
      <div className="oracle-confidence-gauge">
        <div className="oracle-gauge-label">
          <span>SYS CONFIDENCE</span>
          <span className={confidence >= 70 ? 'text-green' : 'text-cyan'}>{confidence}%</span>
        </div>
        <div className="oracle-gauge-track">
          {/* Segmented bar */}
          {Array.from({ length: 20 }).map((_, i) => {
            const threshold = (i + 1) * 5;
            const active = confidence >= threshold;
            const segColor = threshold <= 40 ? '#EF5350' : threshold <= 70 ? '#FFEE58' : '#66BB6A';
            return (
              <motion.div
                key={i}
                className="oracle-gauge-segment"
                style={{
                  backgroundColor: active ? segColor : 'rgba(100,160,255,0.08)',
                  opacity: active ? 1 : 0.3,
                }}
                animate={active ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
              />
            );
          })}
        </div>
      </div>

      {/* Thought text — smaller, as supporting context */}
      <div className="oracle-thought-text">{displayedThought}</div>
    </div>
  );
}
