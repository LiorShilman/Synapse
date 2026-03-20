import { useSimStore } from '../store/useSimStore';
import { AGENTS } from '../agents/agentDefinitions';

const ICON_MAP: Record<string, string> = {
  oracle: '🔮', nexus: '🔗', forge: '⚡', echo: '📡', cipher: '🔐', sage: '🧠',
};
const VIZ_LABEL_MAP: Record<string, string> = {
  oracle: 'ניתוח נתונים', nexus: 'רשת קשרים', forge: 'יצירתיות',
  echo: 'זיכרון', cipher: 'אימות לוגי', sage: 'סינתזה',
};

interface AgentMeta { name: string; role: string; color: string; icon: string; vizLabel: string; avatar: string }

const AGENT_META: Record<string, AgentMeta> = {};
for (const a of AGENTS) {
  AGENT_META[a.id] = {
    name: a.name,
    role: a.role,
    color: a.color,
    icon: ICON_MAP[a.id] || '●',
    vizLabel: VIZ_LABEL_MAP[a.id] || '',
    avatar: a.avatar,
  };
}

const CONSENSUS_PROTOCOL = [
  'מבקש סינתזה קולקטיבית',
  'קונצנזוס מתגבש בנושא',
  'לוגיקה אומתה',
  'שומר קונצנזוס בזיכרון',
  'אנומליה זוהתה',
];

function isProtocolMsg(text: string) {
  return CONSENSUS_PROTOCOL.some((p) => text.startsWith(p));
}

function renderMd(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
}

/** Build an SVG confidence gauge ring */
function svgGauge(value: number, color: string, size: number, label: string): string {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - value / 100);
  return `
    <div class="gauge-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"
          transform="rotate(-90 ${size / 2} ${size / 2})" class="gauge-ring"/>
      </svg>
      <div class="gauge-value" style="color:${color}">${value}%</div>
      <div class="gauge-label">${label}</div>
    </div>`;
}

/** Build per-agent unique visualization HTML */
function agentVizHtml(agentId: string, confidence: number, thought: string, color: string): string {
  switch (agentId) {
    case 'oracle': {
      // Extract numbers from thought
      const nums = thought.match(/\d+\.?\d*/g)?.slice(0, 4) || [];
      const metrics = nums.map((n, i) => {
        const labels = ['מגמה', 'התפלגות', 'סטייה', 'ציון'];
        return `<div class="viz-metric"><span class="viz-metric-val" style="color:${color}">${n}</span><span class="viz-metric-lbl">${labels[i] || `מדד ${i + 1}`}</span></div>`;
      });
      return `<div class="viz-oracle">${metrics.join('') || '<span class="viz-no-data">מנתח...</span>'}
        <div class="viz-bar-track"><div class="viz-bar-fill" style="width:${confidence}%;background:${color}"></div></div></div>`;
    }
    case 'sage': {
      // Show other agent confidence pips
      const store = useSimStore.getState();
      const pips = Object.values(store.agents)
        .filter((a) => a.id !== 'sage')
        .map((a) => {
          const m = AGENT_META[a.id];
          return `<div class="viz-pip"><span class="viz-pip-dot" style="background:${m?.color || '#888'}"></span><span class="viz-pip-name">${m?.name || a.id}</span><span class="viz-pip-conf" style="color:${m?.color || '#888'}">${a.confidence}%</span></div>`;
        }).join('');
      return `<div class="viz-sage">${pips}
        <div class="viz-synthesis-bar"><div class="viz-synthesis-fill" style="width:${confidence}%;background:linear-gradient(90deg,${color},#FF7043)"></div></div></div>`;
    }
    case 'cipher': {
      const checks = [
        { label: 'עקביות', pass: confidence > 40 },
        { label: 'הנחות', pass: confidence > 50 },
        { label: 'מקרי קצה', pass: confidence > 60 },
        { label: 'חוסן', pass: confidence > 55 },
      ];
      return `<div class="viz-cipher">${checks.map((c) =>
        `<div class="viz-check"><span class="viz-check-icon ${c.pass ? 'viz-pass' : 'viz-fail'}">${c.pass ? '✓' : '✗'}</span><span>${c.label}</span></div>`
      ).join('')}</div>`;
    }
    case 'echo': {
      const store = useSimStore.getState();
      const echoMsgs = store.messages.filter((m) => m.fromId === 'echo').slice(0, 5);
      const dots = echoMsgs.map((m, i) => {
        const time = new Date(m.timestamp).toLocaleTimeString('he-IL', { hour12: false });
        return `<div class="viz-mem-dot"><span class="viz-mem-time">${time}</span><span class="viz-mem-line" style="opacity:${1 - i * 0.15}"></span></div>`;
      }).join('');
      return `<div class="viz-echo"><div class="viz-mem-counter"><span style="color:${color};font-size:1.3rem;font-weight:800">${echoMsgs.length}</span><span>זכרונות</span></div><div class="viz-mem-timeline">${dots}</div></div>`;
    }
    case 'nexus': {
      // SVG mini-network of agents
      const positions = [
        { x: 50, y: 10 }, { x: 90, y: 40 }, { x: 80, y: 80 },
        { x: 20, y: 80 }, { x: 10, y: 40 }, { x: 50, y: 50 },
      ];
      const agents = Object.keys(AGENT_META);
      const lines = agents.flatMap((_, i) =>
        agents.slice(i + 1).map((_, j) => {
          const a = positions[i], b = positions[i + j + 1];
          return b ? `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-opacity="0.15"/>` : '';
        })
      ).join('');
      const nodes = agents.map((id, i) => {
        const p = positions[i], m = AGENT_META[id];
        return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${m.color}" opacity="0.8"/>`;
      }).join('');
      return `<div class="viz-nexus"><svg viewBox="0 0 100 90" width="120" height="108">${lines}${nodes}</svg></div>`;
    }
    case 'forge': {
      // Heat gauge segments
      const segments = 12;
      const active = Math.round((confidence / 100) * segments);
      const segs = Array.from({ length: segments }, (_, i) => {
        const hue = i < segments / 3 ? '210,80%,60%' : i < (segments * 2) / 3 ? '30,90%,55%' : '0,75%,55%';
        const on = i < active;
        return `<div class="viz-heat-seg" style="background:${on ? `hsl(${hue})` : 'rgba(255,255,255,0.04)'}"></div>`;
      }).join('');
      return `<div class="viz-forge"><div class="viz-heat-bar">${segs}</div></div>`;
    }
    default:
      return '';
  }
}

interface GenerateOptions {
  reportTitle: string;
  reportSubtitle: string;
  filePrefix: string;
}

export function generateReportHtml(options: GenerateOptions): string {
  const store = useSimStore.getState();
  const { reportTitle, reportSubtitle } = options;

  const dateStr = new Date().toLocaleString('he-IL', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const agents = Object.values(store.agents);
  const elapsed = Math.floor((Date.now() - store.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // ──── Agent cards with unique viz ────
  const agentCardsHtml = agents.map((a) => {
    const meta = AGENT_META[a.id] ?? { name: a.id, role: '', color: '#888', icon: '●', vizLabel: '', avatar: '' };
    const viz = agentVizHtml(a.id, a.confidence, a.currentThought, meta.color);
    return `
      <div class="agent-card" style="border-top:3px solid ${meta.color}">
        <div class="agent-header">
          <img src="${meta.avatar}" alt="${meta.name}" class="agent-avatar" style="border-color:${meta.color}" onerror="this.style.display='none';this.nextElementSibling.style.display=''">
          <span class="agent-icon" style="display:none">${meta.icon}</span>
          <div class="agent-info">
            <span class="agent-name" style="color:${meta.color}">${meta.name}</span>
            <span class="agent-role">${meta.role}</span>
          </div>
          ${svgGauge(a.confidence, meta.color, 56, '')}
        </div>
        <div class="agent-viz-label" style="color:${meta.color}">${meta.vizLabel}</div>
        ${viz}
        <div class="agent-thought">"${a.currentThought || '—'}"</div>
      </div>`;
  }).join('');

  // ──── Decision reasoning ────
  const decisionHtml = agents.map((a) => {
    const meta = AGENT_META[a.id] ?? { name: a.id, role: '', color: '#888', icon: '●', vizLabel: '' };
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
          <span class="decision-conf" style="color:${meta.color}">${a.confidence}%</span>
        </div>
        <div class="decision-thought">${thought}</div>
      </div>`;
  }).filter(Boolean).join('');

  // ──── Key insights ────
  const seenTexts = new Set<string>();
  const keyInsights = store.messages
    .filter((m) => (m.category === 'synthesis' || m.category === 'insight') && !isProtocolMsg(m.text))
    .filter((m) => { if (seenTexts.has(m.text)) return false; seenTexts.add(m.text); return true; })
    .slice(0, 10).reverse()
    .map((m) => {
      const meta = AGENT_META[m.fromId];
      return `
        <div class="insight-item">
          <span class="insight-icon">${meta?.icon ?? '●'}</span>
          <span class="insight-agent" style="color:${meta?.color ?? '#aaa'}">${meta?.name ?? m.fromId}:</span>
          <span class="insight-text">${m.text}</span>
        </div>`;
    }).join('') || '<div class="no-data">לא זוהו תובנות מפתח</div>';

  // ──── Consensus events ────
  const seenInsights = new Set<string>();
  const uniqueConsensus = store.consensusEvents.filter((c) => {
    if (seenInsights.has(c.insight)) return false; seenInsights.add(c.insight); return true;
  });
  const consensusHtml = uniqueConsensus.map((c) => {
    const time = new Date(c.timestamp).toLocaleTimeString('he-IL', { hour12: false });
    return `<div class="consensus-event"><span class="ce-time">${time}</span><span class="ce-text">${c.insight}</span></div>`;
  }).join('') || '<div class="no-data">לא נרשמו אירועי קונצנזוס</div>';

  // ──── Messages timeline ────
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

  // ──── Confidence bar chart ────
  const confChartHtml = agents.map((a) => {
    const meta = AGENT_META[a.id] ?? { name: a.id, color: '#888', icon: '●', role: '', vizLabel: '' };
    return `
      <div class="conf-chart-row">
        <span class="conf-chart-icon">${meta.icon}</span>
        <span class="conf-chart-name" style="color:${meta.color}">${meta.name}</span>
        <div class="conf-chart-bar"><div class="conf-chart-fill" style="width:${a.confidence}%;background:linear-gradient(90deg,${meta.color}88,${meta.color})"></div></div>
        <span class="conf-chart-val" style="color:${meta.color}">${a.confidence}%</span>
      </div>`;
  }).join('');

  // ──── Summary ────
  const summaryContent = store.solutionSummary
    ? renderMd(store.solutionSummary)
    : 'טרם הושג קונצנזוס — התהליך הופסק לפני הגעה למסקנה.';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>סינאפס — ${reportTitle}: ${store.currentProblem}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap');

  :root {
    --bg-deep: #030812;
    --bg-surface: #0A1628;
    --bg-card: #0D1F3C;
    --text-primary: #E8F4FD;
    --text-secondary: #8BAFD4;
    --text-muted: #4A6A8A;
    --accent: #4FC3F7;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Heebo', sans-serif;
    background: var(--bg-deep);
    color: var(--text-primary);
    line-height: 1.7;
    min-height: 100vh;
  }

  .page { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; }

  /* ══════ HERO ══════ */
  .hero {
    text-align: center;
    padding: 60px 20px 50px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 800px;
    background: radial-gradient(circle, rgba(79,195,247,0.06) 0%, rgba(206,147,216,0.04) 40%, transparent 70%);
    pointer-events: none;
    animation: heroPulse 8s ease-in-out infinite;
  }
  @keyframes heroPulse {
    0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
  }
  .hero-brand {
    font-size: 0.85rem;
    letter-spacing: 8px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
    font-weight: 300;
  }
  .hero-title {
    font-size: 2.6rem;
    font-weight: 900;
    background: linear-gradient(135deg, #4FC3F7 0%, #B39DDB 40%, #FF7043 70%, #66BB6A 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 24px;
    animation: gradientShift 6s ease infinite;
    background-size: 300% 300%;
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .hero-problem {
    background: linear-gradient(135deg, rgba(79,195,247,0.1), rgba(206,147,216,0.08));
    border: 1px solid rgba(79,195,247,0.2);
    border-radius: 20px;
    padding: 28px 36px;
    font-size: 1.4rem;
    font-weight: 500;
    max-width: 750px;
    margin: 0 auto 32px;
    color: #fff;
    position: relative;
  }
  .hero-problem::before {
    content: '❝'; position: absolute; top: 8px; right: 12px;
    font-size: 2rem; color: rgba(79,195,247,0.2);
  }

  /* Meta stats row */
  .meta-row { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
  .meta-chip {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg-surface);
    border: 1px solid rgba(100,160,255,0.1);
    border-radius: 24px;
    padding: 8px 18px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  .meta-val { color: var(--text-primary); font-weight: 700; }

  /* ══════ VERDICT / CONSENSUS SUMMARY ══════ */
  .verdict {
    margin-top: 48px;
    position: relative;
    border-radius: 20px;
    overflow: hidden;
  }
  .verdict::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(102,187,106,0.12) 0%, rgba(255,213,79,0.08) 50%, rgba(79,195,247,0.06) 100%);
    pointer-events: none;
  }
  .verdict-inner {
    position: relative;
    border: 1px solid rgba(102,187,106,0.3);
    border-radius: 20px;
    padding: 36px 40px;
  }
  .verdict-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  .verdict-icon {
    font-size: 2rem;
    width: 56px; height: 56px;
    background: rgba(102,187,106,0.15);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    animation: verdictGlow 3s ease-in-out infinite;
  }
  @keyframes verdictGlow {
    0%, 100% { box-shadow: 0 0 0 rgba(102,187,106,0); }
    50% { box-shadow: 0 0 24px rgba(102,187,106,0.3); }
  }
  .verdict-title { font-size: 1.5rem; font-weight: 800; color: #A5D6A7; }
  .verdict-conf {
    margin-right: auto;
    font-size: 2rem;
    font-weight: 900;
    color: #66BB6A;
  }
  .verdict-body {
    font-size: 1.05rem;
    line-height: 2;
    color: #CCDDEE;
  }
  .verdict-body h2, .verdict-body h3, .verdict-body h4 { color: var(--accent); margin: 14px 0 6px; }
  .md-h2 { font-size: 1.2rem; color: var(--accent); margin: 16px 0 8px; }
  .md-h3 { font-size: 1.1rem; color: var(--accent); margin: 14px 0 6px; }
  .md-h4 { font-size: 1rem; color: var(--accent); margin: 12px 0 4px; }
  .verdict-body strong { color: #E0E6ED; }
  .verdict-body li { margin: 2px 0; list-style: disc inside; }

  /* ══════ CONFIDENCE CHART ══════ */
  .conf-chart { margin-top: 48px; }
  .conf-chart-row {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 10px;
  }
  .conf-chart-icon { font-size: 1.2rem; width: 28px; text-align: center; }
  .conf-chart-name { width: 60px; font-weight: 700; font-size: 0.9rem; }
  .conf-chart-bar {
    flex: 1; height: 10px;
    background: rgba(255,255,255,0.04);
    border-radius: 5px; overflow: hidden;
  }
  .conf-chart-fill {
    height: 100%; border-radius: 5px;
    animation: barGrow 1.2s ease-out;
  }
  @keyframes barGrow { from { width: 0 !important; } }
  .conf-chart-val { width: 48px; text-align: left; font-weight: 800; font-size: 0.95rem; }

  /* ══════ SECTION ══════ */
  .section { margin-top: 48px; }
  .section-title {
    font-size: 1.3rem; font-weight: 700;
    margin-bottom: 20px; padding-bottom: 12px;
    border-bottom: 1px solid rgba(79,195,247,0.12);
    display: flex; align-items: center; gap: 10px;
  }
  .section-icon { font-size: 1.4rem; }

  /* ══════ AGENT CARDS GRID ══════ */
  .agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }
  .agent-card {
    background: var(--bg-surface);
    border: 1px solid rgba(100,160,255,0.08);
    border-radius: 16px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
  }
  .agent-card::after {
    content: '';
    position: absolute; top: 0; right: 0;
    width: 100px; height: 100px;
    background: radial-gradient(circle at top right, currentColor, transparent 70%);
    opacity: 0.03;
    pointer-events: none;
  }
  .agent-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .agent-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; object-position: top; border: 2px solid var(--accent); flex-shrink: 0; }
  .agent-icon { font-size: 1.6rem; }
  .agent-info { flex: 1; }
  .agent-name { font-weight: 800; font-size: 1.15rem; display: block; }
  .agent-role { color: var(--text-muted); font-size: 0.8rem; }
  .agent-viz-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
  .agent-thought { font-size: 0.85rem; color: var(--text-secondary); font-style: italic; margin-top: 10px; border-top: 1px solid rgba(100,160,255,0.06); padding-top: 10px; }

  /* Gauge */
  .gauge-wrap { position: relative; width: 56px; height: 56px; }
  .gauge-value {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.85rem; font-weight: 900;
  }
  .gauge-label { display: none; }
  .gauge-ring { transition: stroke-dashoffset 0.5s; }

  /* ──── Agent viz specifics ──── */
  .viz-oracle { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .viz-metric {
    display: flex; flex-direction: column; align-items: center;
    background: rgba(79,195,247,0.06);
    border-radius: 8px; padding: 6px 12px; min-width: 60px;
  }
  .viz-metric-val { font-size: 1.1rem; font-weight: 800; }
  .viz-metric-lbl { font-size: 0.7rem; color: var(--text-muted); }
  .viz-bar-track { width: 100%; height: 5px; background: rgba(255,255,255,0.04); border-radius: 3px; margin-top: 8px; overflow: hidden; }
  .viz-bar-fill { height: 100%; border-radius: 3px; }
  .viz-no-data { color: var(--text-muted); font-size: 0.85rem; }

  .viz-sage { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .viz-pip { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; background: rgba(255,213,79,0.06); border-radius: 6px; padding: 3px 8px; }
  .viz-pip-dot { width: 8px; height: 8px; border-radius: 50%; }
  .viz-pip-name { color: var(--text-secondary); }
  .viz-pip-conf { font-weight: 700; }
  .viz-synthesis-bar { width: 100%; height: 5px; background: rgba(255,255,255,0.04); border-radius: 3px; margin-top: 8px; overflow: hidden; }
  .viz-synthesis-fill { height: 100%; border-radius: 3px; }

  .viz-cipher { display: flex; gap: 8px; flex-wrap: wrap; }
  .viz-check { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: var(--text-secondary); background: rgba(239,154,154,0.06); border-radius: 6px; padding: 4px 10px; }
  .viz-check-icon { font-weight: 900; font-size: 1rem; }
  .viz-pass { color: #66BB6A; }
  .viz-fail { color: #EF5350; }

  .viz-echo { display: flex; align-items: center; gap: 16px; }
  .viz-mem-counter { display: flex; flex-direction: column; align-items: center; background: rgba(102,187,106,0.08); border-radius: 10px; padding: 8px 14px; }
  .viz-mem-counter span:last-child { font-size: 0.7rem; color: var(--text-muted); }
  .viz-mem-timeline { display: flex; gap: 6px; flex-wrap: wrap; }
  .viz-mem-dot { display: flex; flex-direction: column; align-items: center; }
  .viz-mem-time { font-size: 0.65rem; color: var(--text-muted); direction: ltr; }
  .viz-mem-line { width: 3px; height: 16px; background: #66BB6A; border-radius: 2px; }

  .viz-nexus { display: flex; justify-content: center; }
  .viz-nexus svg { filter: drop-shadow(0 0 4px rgba(206,147,216,0.3)); }

  .viz-forge {}
  .viz-heat-bar { display: flex; gap: 3px; height: 14px; }
  .viz-heat-seg { flex: 1; border-radius: 3px; min-width: 12px; }

  /* ══════ DECISION CARDS ══════ */
  .decision-card {
    background: var(--bg-surface);
    border: 1px solid rgba(100,160,255,0.08);
    border-right: 4px solid var(--accent);
    border-radius: 0 12px 12px 0;
    padding: 16px 20px;
    margin-bottom: 12px;
  }
  .decision-agent { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .decision-icon { font-size: 1.2rem; }
  .decision-role { color: var(--text-muted); font-size: 0.8rem; }
  .decision-conf { margin-right: auto; font-weight: 800; }
  .decision-thought { color: #CCDDEE; font-size: 0.95rem; line-height: 1.7; }

  /* ══════ INSIGHTS ══════ */
  .insight-item {
    display: flex; gap: 8px; align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid rgba(100,160,255,0.05);
  }
  .insight-icon { font-size: 1rem; margin-top: 3px; }
  .insight-agent { font-weight: 700; white-space: nowrap; font-size: 0.9rem; }
  .insight-text { color: #AABBCC; font-size: 0.9rem; line-height: 1.6; }

  /* ══════ CONSENSUS EVENTS ══════ */
  .consensus-event {
    background: rgba(102,187,106,0.06);
    border: 1px solid rgba(102,187,106,0.15);
    border-radius: 10px;
    padding: 12px 18px;
    margin-bottom: 8px;
    display: flex; gap: 14px; align-items: center;
  }
  .ce-time { color: #66BB6A; font-size: 0.85rem; direction: ltr; min-width: 60px; font-weight: 600; }
  .ce-text { color: #A5D6A7; font-weight: 500; }

  /* ══════ TIMELINE ══════ */
  .timeline { display: flex; flex-direction: column; gap: 6px; }
  .msg {
    background: var(--bg-surface);
    border-right: 3px solid rgba(100,160,255,0.12);
    border-radius: 0 10px 10px 0;
    padding: 12px 18px;
  }
  .msg-user { background: rgba(79,195,247,0.04); border-right-color: #81D4FA; }
  .msg-synthesis { background: rgba(255,213,79,0.04); border-right-color: #FFEE58; }
  .msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.85rem; }
  .msg-num { color: var(--text-muted); font-size: 0.75rem; min-width: 32px; }
  .msg-icon { font-size: 1rem; }
  .msg-from { font-weight: 700; }
  .msg-arrow { color: var(--text-muted); }
  .msg-to { color: var(--text-secondary); }
  .msg-time { margin-right: auto; color: var(--text-muted); font-size: 0.8rem; direction: ltr; }
  .msg-text { font-size: 0.92rem; color: #CCDDEE; line-height: 1.7; }
  .no-data { color: var(--text-muted); font-style: italic; padding: 16px; }

  /* ══════ FOOTER ══════ */
  .footer {
    text-align: center;
    margin-top: 64px;
    padding-top: 24px;
    border-top: 1px solid rgba(100,160,255,0.08);
    color: var(--text-muted);
    font-size: 0.85rem;
  }
  .footer-brand {
    font-size: 1.8rem; font-weight: 900;
    background: linear-gradient(135deg, #4FC3F7, #B39DDB, #FF7043);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; margin-bottom: 8px;
  }

  /* ══════ RESPONSIVE ══════ */
  @media (max-width: 768px) {
    .hero-title { font-size: 1.8rem; }
    .hero-problem { font-size: 1.1rem; padding: 18px 22px; }
    .agents-grid { grid-template-columns: 1fr; }
    .meta-row { gap: 8px; }
    .meta-chip { padding: 6px 12px; font-size: 0.8rem; }
    .verdict-inner { padding: 24px 20px; }
    .verdict-conf { font-size: 1.5rem; }
  }

  /* ══════ PRINT ══════ */
  @media print {
    body { background: #fff; color: #222; }
    .agent-card, .decision-card, .msg, .consensus-event { border-color: #ddd; background: #fafafa; }
    .hero::before, .verdict::before { display: none; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HERO -->
  <div class="hero">
    <div class="hero-brand">◆ סינאפס — אינטליגנציה קולקטיבית ◆</div>
    <h1 class="hero-title">${reportTitle}</h1>
    <div class="hero-problem">${store.currentProblem}</div>
    <div class="meta-row">
      <div class="meta-chip">📅 <span class="meta-val">${dateStr}</span></div>
      <div class="meta-chip">🔄 <span class="meta-val">${store.tickCount}</span> מחזורים</div>
      <div class="meta-chip">⏱ <span class="meta-val">${mins}:${String(secs).padStart(2, '0')}</span></div>
      <div class="meta-chip">💬 <span class="meta-val">${store.messages.length}</span> הודעות</div>
    </div>
  </div>

  <!-- VERDICT -->
  <div class="verdict">
    <div class="verdict-inner">
      <div class="verdict-header">
        <div class="verdict-icon">✦</div>
        <div class="verdict-title">סיכום קונצנזוס</div>
        <div class="verdict-conf">${store.globalConfidence}%</div>
      </div>
      <div class="verdict-body">${summaryContent}</div>
    </div>
  </div>

  <!-- CONFIDENCE CHART -->
  <div class="conf-chart section">
    <div class="section-title"><span class="section-icon">📊</span> מפת ביטחון</div>
    ${confChartHtml}
  </div>

  <!-- AGENT CARDS -->
  <div class="section">
    <div class="section-title"><span class="section-icon">🤖</span> סוכנים — מצב סופי וויזואליזציות</div>
    <div class="agents-grid">${agentCardsHtml}</div>
  </div>

  <!-- DECISION REASONING -->
  <div class="section">
    <div class="section-title"><span class="section-icon">🧩</span> מה הוביל להחלטה — עמדת כל סוכן</div>
    ${decisionHtml}
  </div>

  <!-- KEY INSIGHTS -->
  <div class="section">
    <div class="section-title"><span class="section-icon">💡</span> תובנות מפתח</div>
    ${keyInsights}
  </div>

  <!-- CONSENSUS EVENTS -->
  <div class="section">
    <div class="section-title"><span class="section-icon">🏁</span> אירועי קונצנזוס</div>
    ${consensusHtml}
  </div>

  <!-- FULL TIMELINE -->
  <div class="section">
    <div class="section-title"><span class="section-icon">💬</span> השתלשלות מלאה (${allMessages.length} הודעות)</div>
    <div class="timeline">${messagesHtml}</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">SYNAPSE</div>
    ${reportSubtitle}<br>
    ${dateStr}
  </div>

</div>
</body>
</html>`;
}

export function downloadReport(options: GenerateOptions) {
  const html = generateReportHtml(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `synapse-${options.filePrefix}-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
