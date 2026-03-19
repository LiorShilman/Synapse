import { useMemo, useRef, useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';

/** Escape HTML entities to prevent XSS */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Simple markdown-to-HTML for consensus summary (XSS-safe) */
function renderMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
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
  const isStreaming = useSimStore((s) => s.isStreaming);
  const globalConfidence = useSimStore((s) => s.globalConfidence);
  const currentProblem = useSimStore((s) => s.currentProblem);
  const bodyRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => renderMarkdown(solutionSummary ?? ''), [solutionSummary]);

  // Auto-scroll to bottom as streaming content arrives
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [solutionSummary]);

  if (!solutionSummary) return null;

  return (
    <div className={`results-summary${isStreaming ? ' results-streaming' : ''}`}>
      <div className="results-header">
        <span className="results-icon">✦</span>
        <span>סיכום קונצנזוס</span>
        {isStreaming && <span className="results-writing-label">כותב...</span>}
        <span className="results-confidence">{globalConfidence}%</span>
      </div>
      <div className="results-problem">
        בעיה: {currentProblem}
      </div>
      <div
        ref={bodyRef}
        className="results-body"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: html + (isStreaming ? '<span class="streaming-cursor">▊</span>' : '') }}
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
