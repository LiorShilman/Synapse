import { useMemo } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { useTypewriter } from '../../hooks/useTypewriter';

/** Simple markdown-to-HTML for consensus summary */
function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h4 style="color:#4FC3F7;margin:12px 0 4px;font-size:1rem">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#4FC3F7;margin:14px 0 6px;font-size:1.1rem">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="color:#4FC3F7;margin:16px 0 8px;font-size:1.2rem">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E0E0E0">$1</strong>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0;list-style:disc inside">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export default function ResultsSummary() {
  const solutionSummary = useSimStore((s) => s.solutionSummary);
  const globalConfidence = useSimStore((s) => s.globalConfidence);
  const currentProblem = useSimStore((s) => s.currentProblem);
  const displayText = useTypewriter(solutionSummary ?? '', 15);

  const html = useMemo(() => renderMarkdown(displayText), [displayText]);

  if (!solutionSummary) return null;

  return (
    <div className="results-summary">
      <div className="results-header">
        <span className="results-icon">✦</span>
        <span>סיכום קונצנזוס</span>
        <span className="results-confidence">{globalConfidence}%</span>
      </div>
      <div className="results-problem">
        בעיה: {currentProblem}
      </div>
      <div
        className="results-body"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="results-actions">
        <button
          className="problem-btn problem-btn-feedback"
          onClick={() => {
            useSimStore.getState().setSolutionSummary(null);
          }}
        >
          סגור
        </button>
      </div>
    </div>
  );
}
