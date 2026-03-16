import { useState } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { downloadReport } from '../../utils/generateReportHtml';

const CATEGORIES = [
  {
    id: 'tech',
    label: 'טכנולוגיה',
    icon: '💻',
    color: '#4FC3F7',
    examples: [
      'Monolith vs Microservices — מה מתאים לסטארטאפ בשלב ראשוני?',
      'האם לבנות מערכת real-time ב-WebSocket או ב-SSE?',
      'מעבר מ-REST ל-GraphQL — מתי זה שווה את ההשקעה?',
      'האם לפתח אפליקציה native או cross-platform?',
    ],
  },
  {
    id: 'business',
    label: 'עסקים',
    icon: '📊',
    color: '#CE93D8',
    examples: [
      'האם להיכנס לשוק חדש או להעמיק בשוק הקיים?',
      'B2B או B2C — מה מתאים למוצר SaaS חדש?',
      'האם לגייס משקיעים או לגדול אורגנית (bootstrapping)?',
      'מיתוג מחדש — מתי הסיכון שווה את הפוטנציאל?',
    ],
  },
  {
    id: 'career',
    label: 'קריירה',
    icon: '🎯',
    color: '#FFAB40',
    examples: [
      'לעבור לתפקיד ניהולי או להישאר hands-on?',
      'האם לעזוב עבודה יציבה בשביל סטארטאפ?',
      'תואר שני או ניסיון מעשי — מה יקדם יותר?',
      'Freelance או משרה קבועה — מה מתאים עכשיו?',
    ],
  },
  {
    id: 'product',
    label: 'מוצר',
    icon: '🚀',
    color: '#66BB6A',
    examples: [
      'MVP מינימלי או מוצר מלוטש — מה לשחרר קודם?',
      'האם להוסיף AI למוצר קיים או לבנות מוצר AI-native?',
      'Freemium או תקופת ניסיון — איזה מודל מתאים?',
      'לפתח פיצ׳ר שמשתמשים מבקשים או לחדש?',
    ],
  },
  {
    id: 'education',
    label: 'חינוך',
    icon: '📚',
    color: '#EF9A9A',
    examples: [
      'למידה מרחוק או פרונטלית — מה יעיל יותר?',
      'האם לשלב AI בתהליכי הוראה?',
      'התמחות צרה או ידע רחב — מה עדיף בעולם המשתנה?',
      'למידה עצמאית או מסגרת מובנית — מתי מה?',
    ],
  },
  {
    id: 'management',
    label: 'ניהול',
    icon: '👥',
    color: '#FFD54F',
    examples: [
      'צוות מרוחק או משרד — מה מניב תוצאות טובות יותר?',
      'Agile או Waterfall — מתי כל גישה מתאימה?',
      'האם לפטר עובד בעייתי או לנסות לשקם?',
      'Flat hierarchy או מבנה היררכי — מה מתאים לצוות של 30?',
    ],
  },
];

export default function ProblemInput() {
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const mode = useSimStore((s) => s.mode);
  const isSolving = useSimStore((s) => s.isSolving);
  const isApiMode = useSimStore((s) => s.isApiMode);
  const solutionSummary = useSimStore((s) => s.solutionSummary);
  const pendingQuestion = useSimStore((s) => s.pendingQuestion);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const store = useSimStore.getState();
    store.setUserProblem(trimmed);
    store.startSolving();
    setInput('');
  };

  const handleFeedback = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const store = useSimStore.getState();
    store.sendUserFeedback(trimmed);
    // Clear pending question if answering one
    if (store.pendingQuestion) {
      store.setPendingQuestion(null);
    }
    // Resume solving if it was paused (after consensus or question)
    if (!isSolving && mode === 'solving') {
      store.resumeSolving();
    }
    setInput('');
  };

  const handleReset = () => {
    useSimStore.getState().resetForNewProblem();
    setInput('');
  };

  const handlePause = () => {
    useSimStore.getState().pauseSolving();
  };

  const handleResume = () => {
    useSimStore.getState().resumeSolving();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'solving') {
        handleFeedback();
      } else {
        handleSubmit();
      }
    }
  };

  const handleSave = () => {
    downloadReport({
      reportTitle: 'ניתוח דילמה',
      reportSubtitle: 'מצב AI — ניתוח מבוסס Claude API',
      filePrefix: 'analysis',
    });
  };

  if (!isApiMode) return null;

  const isPaused = mode === 'solving' && !isSolving;

  return (
    <div className="problem-input-container">
      <div className="problem-input-header">
        {mode === 'solving'
          ? (pendingQuestion
              ? '❓ הסוכנים צריכים מידע נוסף'
              : isPaused ? 'הושג קונצנזוס — התהליך הושהה' : 'בעיה בפתרון')
          : 'הגדר בעיה לפתרון'}
      </div>
      {pendingQuestion && (
        <div className="problem-question-box">
          {pendingQuestion}
        </div>
      )}

      {/* Category chips — show when not solving */}
      {mode !== 'solving' && (
        <div className="category-section">
          <div className="category-chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-chip ${selectedCategory === cat.id ? 'category-chip-active' : ''}`}
                style={{
                  borderColor: selectedCategory === cat.id ? cat.color : undefined,
                  background: selectedCategory === cat.id ? `${cat.color}15` : undefined,
                  color: selectedCategory === cat.id ? cat.color : undefined,
                }}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <span className="category-chip-icon">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          {selectedCategory && (
            <div className="category-examples">
              {CATEGORIES.find((c) => c.id === selectedCategory)?.examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="category-example"
                  onClick={() => {
                    setInput(ex);
                    setSelectedCategory(null);
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="problem-input-row">
        <textarea
          className="problem-input-field"
          dir="rtl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'solving'
              ? (pendingQuestion ? 'הקלד תשובה לשאלה...' : 'שלח משוב או כיוון חדש לסוכנים...')
              : 'בחר קטגוריה למעלה או תאר דילמה משלך...'
          }
          rows={2}
        />
        <div className="problem-input-buttons">
          {mode === 'solving' ? (
            <>
              <button
                className="problem-btn problem-btn-feedback"
                onClick={handleFeedback}
                disabled={!input.trim()}
              >
                שלח משוב
              </button>
              {isSolving ? (
                <button
                  className="problem-btn problem-btn-stop"
                  onClick={handlePause}
                >
                  ⏸ עצור
                </button>
              ) : (
                <button
                  className="problem-btn problem-btn-resume"
                  onClick={handleResume}
                >
                  ▶ המשך
                </button>
              )}
              <button
                className="problem-btn problem-btn-reset"
                onClick={handleReset}
              >
                בעיה חדשה
              </button>
              <button
                className="problem-btn problem-btn-save"
                onClick={handleSave}
                title="שמור תהליך לקובץ"
              >
                💾
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
          ✓ הושג קונצנזוס — ניתן לשלוח משוב לכיוון אחר או לשמור את התוצאה
        </div>
      )}
    </div>
  );
}
