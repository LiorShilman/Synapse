import { useState } from 'react';
import { useSimStore } from '../../store/useSimStore';

export default function ProblemInput() {
  const [input, setInput] = useState('');
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
    const store = useSimStore.getState();

    const AGENT_META: Record<string, { name: string; role: string; color: string; icon: string }> = {
      oracle: { name: 'אורקל', role: 'אנליסט ראשי', color: '#4FC3F7', icon: '🔮' },
      nexus: { name: 'נקסוס', role: 'מרכז תקשורת', color: '#CE93D8', icon: '🔗' },
      forge: { name: 'פורג׳', role: 'ממזג רעיונות', color: '#FFAB40', icon: '⚡' },
      echo: { name: 'אקו', role: 'זיכרון קולקטיבי', color: '#66BB6A', icon: '📡' },
      cipher: { name: 'סייפר', role: 'מאמת לוגי', color: '#EF9A9A', icon: '🔐' },
      sage: { name: 'סייג׳', role: 'מסנתז חוכמה', color: '#FFD54F', icon: '🧠' },
    };

    const agents = Object.values(store.agents);
    const dateStr = new Date().toLocaleString('he-IL', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });

    const agentCards = agents.map((a) => {
      const meta = AGENT_META[a.id] ?? { name: a.id, role: '', color: '#888', icon: '●' };
      const barWidth = Math.max(0, Math.min(100, a.confidence));
      return `
        <div class="agent-card">
          <div class="agent-header">
            <span class="agent-icon">${meta.icon}</span>
            <span class="agent-name" style="color:${meta.color}">${meta.name}</span>
            <span class="agent-role">${meta.role}</span>
            <span class="agent-conf">${a.confidence}%</span>
          </div>
          <div class="conf-bar"><div class="conf-fill" style="width:${barWidth}%;background:${meta.color}"></div></div>
          <div class="agent-thought">${a.currentThought || '—'}</div>
        </div>`;
    }).join('');

    // Group messages into phases based on consensus events
    const allMessages = store.messages.slice().reverse();
    const messagesHtml = allMessages.map((m, i) => {
      const meta = AGENT_META[m.fromId];
      const toMeta = AGENT_META[m.toId];
      const isUser = m.fromId === 'user';
      const fromName = isUser ? 'משתמש' : (meta?.name ?? m.fromId);
      const toName = toMeta?.name ?? m.toId;
      const color = isUser ? '#81D4FA' : (meta?.color ?? '#aaa');
      const icon = isUser ? '👤' : (meta?.icon ?? '●');
      const time = new Date(m.timestamp).toLocaleTimeString('he-IL', { hour12: false });
      const isSynthesis = m.category === 'synthesis' || m.category === 'insight';
      const extraClass = isUser ? 'msg-user' : (isSynthesis ? 'msg-synthesis' : '');
      return `
        <div class="msg ${extraClass}">
          <div class="msg-header">
            <span class="msg-num">#${i + 1}</span>
            <span class="msg-icon">${icon}</span>
            <span class="msg-from" style="color:${color}">${fromName}</span>
            <span class="msg-arrow">→</span>
            <span class="msg-to">${toName}</span>
            <span class="msg-time">${time}</span>
          </div>
          <div class="msg-text">${m.text}</div>
        </div>`;
    }).join('');

    // Consensus protocol patterns to filter out from substantive analysis
    const CONSENSUS_PROTOCOL = [
      'מבקש סינתזה קולקטיבית',
      'קונצנזוס מתגבש בנושא',
      'לוגיקה אומתה',
      'שומר קונצנזוס בזיכרון',
      'אנומליה זוהתה',
    ];
    const isProtocolMsg = (text: string) =>
      CONSENSUS_PROTOCOL.some((p) => text.startsWith(p));

    // Build consensus events timeline — deduplicated by insight text
    const seenInsights = new Set<string>();
    const uniqueConsensus = store.consensusEvents.filter((c) => {
      if (seenInsights.has(c.insight)) return false;
      seenInsights.add(c.insight);
      return true;
    });
    const consensusHtml = uniqueConsensus.map((c) => {
      const time = new Date(c.timestamp).toLocaleTimeString('he-IL', { hour12: false });
      return `<div class="consensus-event"><span class="ce-time">${time}</span> <span class="ce-text">${c.insight}</span></div>`;
    }).join('') || '<div class="no-data">לא נרשמו אירועי קונצנזוס</div>';

    // Build decision reasoning — each agent's most substantive contribution
    // Search message history for each agent's best non-protocol message
    const decisionHtml = agents.map((a) => {
      const meta = AGENT_META[a.id] ?? { name: a.id, role: '', color: '#888', icon: '●' };
      // Find the agent's last substantive message (not a consensus protocol message)
      const substantiveMsg = store.messages.find(
        (m) => m.fromId === a.id && !isProtocolMsg(m.text)
      );
      const thought = substantiveMsg?.text || a.currentThought;
      if (!thought) return '';
      return `
        <div class="decision-card" style="border-right-color:${meta.color}">
          <div class="decision-agent">
            <span class="decision-icon">${meta.icon}</span>
            <span style="color:${meta.color};font-weight:700">${meta.name}</span>
            <span class="decision-role">${meta.role}</span>
          </div>
          <div class="decision-thought">${thought}</div>
        </div>`;
    }).filter(Boolean).join('');

    // Extract key synthesis/insight messages — deduplicated and filtered
    const seenTexts = new Set<string>();
    const keyInsights = store.messages
      .filter((m) => (m.category === 'synthesis' || m.category === 'insight') && !isProtocolMsg(m.text))
      .filter((m) => {
        if (seenTexts.has(m.text)) return false;
        seenTexts.add(m.text);
        return true;
      })
      .slice(0, 10)
      .reverse()
      .map((m) => {
        const meta = AGENT_META[m.fromId];
        const fromName = meta?.name ?? m.fromId;
        const color = meta?.color ?? '#aaa';
        const icon = meta?.icon ?? '●';
        return `
          <div class="insight-item">
            <span class="insight-icon">${icon}</span>
            <span class="insight-agent" style="color:${color}">${fromName}:</span>
            <span class="insight-text">${m.text}</span>
          </div>`;
      }).join('') || '<div class="no-data">לא זוהו תובנות מפתח</div>';

    const elapsed = Math.floor((Date.now() - store.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>סינאפס — ניתוח דילמה: ${store.currentProblem}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Heebo', sans-serif;
    background: #030812;
    color: #E0E6ED;
    line-height: 1.7;
    min-height: 100vh;
  }
  .page { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }

  /* Header */
  .header {
    text-align: center;
    padding: 50px 20px 40px;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .brand {
    font-size: 1rem;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #4FC3F7;
    margin-bottom: 12px;
    font-weight: 300;
  }
  .title {
    font-size: 2.2rem;
    font-weight: 900;
    background: linear-gradient(135deg, #4FC3F7, #CE93D8, #FFAB40);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 20px;
  }
  .problem-box {
    background: linear-gradient(135deg, rgba(79,195,247,0.1), rgba(206,147,216,0.1));
    border: 1px solid rgba(79,195,247,0.2);
    border-radius: 16px;
    padding: 24px 32px;
    font-size: 1.3rem;
    font-weight: 500;
    max-width: 700px;
    margin: 0 auto 24px;
    color: #fff;
  }
  .meta-row {
    display: flex;
    justify-content: center;
    gap: 32px;
    flex-wrap: wrap;
  }
  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8899AA;
    font-size: 0.95rem;
  }
  .meta-val { color: #E0E6ED; font-weight: 700; }

  /* Sections */
  .section {
    margin-top: 48px;
  }
  .section-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(79,195,247,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-icon { font-size: 1.4rem; }

  /* Consensus summary */
  .summary-box {
    background: linear-gradient(135deg, rgba(102,187,106,0.08), rgba(255,213,79,0.08));
    border: 1px solid rgba(102,187,106,0.25);
    border-radius: 14px;
    padding: 28px 32px;
    font-size: 1.05rem;
    line-height: 1.9;
    white-space: pre-wrap;
  }

  /* Agent cards */
  .agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
  .agent-card {
    background: rgba(10, 22, 40, 0.8);
    border: 1px solid rgba(100,160,255,0.1);
    border-radius: 12px;
    padding: 18px 20px;
  }
  .agent-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .agent-icon { font-size: 1.3rem; }
  .agent-name { font-weight: 700; font-size: 1.1rem; }
  .agent-role { color: #8899AA; font-size: 0.85rem; flex: 1; }
  .agent-conf { font-weight: 900; font-size: 1.1rem; }
  .conf-bar {
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    margin-bottom: 10px;
    overflow: hidden;
  }
  .conf-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;
  }
  .agent-thought {
    font-size: 0.9rem;
    color: #AABBCC;
    font-style: italic;
  }

  /* Messages timeline */
  .timeline { display: flex; flex-direction: column; gap: 6px; }
  .msg {
    background: rgba(10, 22, 40, 0.6);
    border-right: 3px solid rgba(100,160,255,0.15);
    border-radius: 0 8px 8px 0;
    padding: 12px 18px;
  }
  .msg-user {
    background: rgba(79,195,247,0.06);
    border-right-color: #81D4FA;
  }
  .msg-synthesis {
    background: rgba(255,213,79,0.06);
    border-right-color: #FFD54F;
  }
  .msg-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 0.85rem;
  }
  .msg-num { color: #556677; font-size: 0.8rem; min-width: 32px; }
  .msg-icon { font-size: 1rem; }
  .msg-from { font-weight: 700; }
  .msg-arrow { color: #556677; }
  .msg-to { color: #8899AA; }
  .msg-time { margin-right: auto; color: #556677; font-size: 0.8rem; direction: ltr; }
  .msg-text { font-size: 0.92rem; color: #CCDDEE; line-height: 1.7; }

  /* Consensus events */
  .consensus-event {
    background: rgba(102,187,106,0.08);
    border-radius: 8px;
    padding: 10px 16px;
    margin-bottom: 8px;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .ce-time { color: #66BB6A; font-size: 0.85rem; direction: ltr; min-width: 60px; }
  .ce-text { color: #A5D6A7; font-weight: 500; }
  .no-data { color: #556677; font-style: italic; padding: 16px; }

  /* Footer */
  .footer {
    text-align: center;
    margin-top: 60px;
    padding-top: 24px;
    border-top: 1px solid rgba(100,160,255,0.1);
    color: #556677;
    font-size: 0.85rem;
  }
  .footer a { color: #4FC3F7; text-decoration: none; }

  /* Decision reasoning */
  .decision-card {
    background: rgba(10, 22, 40, 0.7);
    border: 1px solid rgba(100,160,255,0.08);
    border-right: 3px solid #4FC3F7;
    border-radius: 0 10px 10px 0;
    padding: 14px 18px;
    margin-bottom: 10px;
  }
  .decision-agent { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .decision-icon { font-size: 1.1rem; }
  .decision-role { color: #5A7A9A; font-size: 0.8rem; }
  .decision-thought { color: #CCDDEE; font-size: 0.95rem; line-height: 1.7; }
  .insight-item { display: flex; gap: 8px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid rgba(100,160,255,0.05); }
  .insight-icon { font-size: 1rem; margin-top: 2px; }
  .insight-agent { font-weight: 700; white-space: nowrap; font-size: 0.9rem; }
  .insight-text { color: #AABBCC; font-size: 0.9rem; line-height: 1.6; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">◆ סינאפס — אינטליגנציה קולקטיבית ◆</div>
    <h1 class="title">ניתוח דילמה</h1>
    <div class="problem-box">${store.currentProblem}</div>
    <div class="meta-row">
      <div class="meta-item">📅 <span class="meta-val">${dateStr}</span></div>
      <div class="meta-item">🔄 מחזורים: <span class="meta-val">${store.tickCount}</span></div>
      <div class="meta-item">⏱ זמן: <span class="meta-val">${mins}:${String(secs).padStart(2, '0')}</span></div>
      <div class="meta-item">📊 ביטחון כולל: <span class="meta-val">${store.globalConfidence}%</span></div>
      <div class="meta-item">💬 הודעות: <span class="meta-val">${store.messages.length}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">✨</span> סיכום קונצנזוס</div>
    <div class="summary-box">${store.solutionSummary
      ? store.solutionSummary
        .replace(/^### (.+)$/gm, '<h4 style="color:#4FC3F7;margin:12px 0 4px">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="color:#4FC3F7;margin:14px 0 6px">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="color:#4FC3F7;margin:16px 0 8px">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E0E0E0">$1</strong>')
        .replace(/^- (.+)$/gm, '<li style="margin:2px 0;list-style:disc inside">$1</li>')
        .replace(/\n/g, '<br/>')
      : 'טרם הושג קונצנזוס — התהליך הופסק לפני הגעה למסקנה.'}</div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">🧩</span> מה הוביל להחלטה — עמדת כל סוכן</div>
    ${decisionHtml}
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">💡</span> תובנות מפתח בתהליך</div>
    ${keyInsights}
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">🤖</span> מצב סוכנים סופי</div>
    <div class="agents-grid">${agentCards}</div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">🏁</span> אירועי קונצנזוס</div>
    ${consensusHtml}
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">💬</span> השתלשלות מלאה (${allMessages.length} הודעות)</div>
    <div class="timeline">${messagesHtml}</div>
  </div>

  <div class="footer">
    נוצר על ידי <a href="#">סינאפס</a> — מערכת אינטליגנציה קולקטיבית מבוססת AI<br>
    ${dateStr}
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-analysis-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
              : 'תאר את הבעיה שברצונך לפתור...'
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
