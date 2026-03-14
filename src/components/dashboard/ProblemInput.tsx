import { useState } from 'react';
import { useSimStore } from '../../store/useSimStore';

export default function ProblemInput() {
  const [input, setInput] = useState('');
  const mode = useSimStore((s) => s.mode);
  const isSolving = useSimStore((s) => s.isSolving);
  const isApiMode = useSimStore((s) => s.isApiMode);
  const solutionSummary = useSimStore((s) => s.solutionSummary);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const store = useSimStore.getState();
    store.setUserProblem(trimmed);
    store.startSolving();
  };

  const handleFeedback = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    useSimStore.getState().sendUserFeedback(trimmed);
    setInput('');
  };

  const handleReset = () => {
    useSimStore.getState().resetForNewProblem();
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isSolving) {
        handleFeedback();
      } else {
        handleSubmit();
      }
    }
  };

  if (!isApiMode) return null;

  return (
    <div className="problem-input-container">
      <div className="problem-input-header">
        {mode === 'solving' ? 'בעיה בפתרון' : 'הגדר בעיה לפתרון'}
      </div>
      <div className="problem-input-row">
        <textarea
          className="problem-input-field"
          dir="rtl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isSolving
              ? 'שלח משוב או כיוון חדש לסוכנים...'
              : 'תאר את הבעיה שברצונך לפתור...'
          }
          rows={2}
        />
        <div className="problem-input-buttons">
          {isSolving ? (
            <>
              <button
                className="problem-btn problem-btn-feedback"
                onClick={handleFeedback}
                disabled={!input.trim()}
              >
                שלח משוב
              </button>
              <button
                className="problem-btn problem-btn-reset"
                onClick={handleReset}
              >
                בעיה חדשה
              </button>
            </>
          ) : (
            <button
              className="problem-btn problem-btn-solve"
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              התחל פתרון
            </button>
          )}
        </div>
      </div>
      {solutionSummary && (
        <div className="problem-input-hint">
          ✓ הושג קונצנזוס — ניתן לשלוח משוב לכיוון אחר
        </div>
      )}
    </div>
  );
}
