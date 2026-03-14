import { useSimStore } from '../../store/useSimStore';
import { useTypewriter } from '../../hooks/useTypewriter';

export default function ResultsSummary() {
  const solutionSummary = useSimStore((s) => s.solutionSummary);
  const mode = useSimStore((s) => s.mode);
  const globalConfidence = useSimStore((s) => s.globalConfidence);
  const currentProblem = useSimStore((s) => s.currentProblem);
  const displayText = useTypewriter(solutionSummary ?? '', 15);

  if (!solutionSummary || mode !== 'solving') return null;

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
      <div className="results-body" dir="rtl">
        {displayText}
      </div>
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
