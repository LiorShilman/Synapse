import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS } from '../../agents/agentDefinitions';

const AGENT_ICONS: Record<string, string> = {
  oracle: '🔍',
  nexus: '🔗',
  forge: '🔨',
  echo: '📚',
  cipher: '🔒',
  sage: '🧠',
};

const AGENT_DETAILS: Record<string, { longDesc: string; traits: string[] }> = {
  oracle: {
    longDesc: 'העיניים האנליטיות של הקבוצה — סורק נתונים, מזהה מגמות, ומספק הערכות כמותיות.',
    traits: ['אנליטי', 'מדויק', 'הסתברותי', 'מבוסס נתונים'],
  },
  nexus: {
    longDesc: 'הדיפלומט — מחבר בין תובנות שונות, מתאם עמדות, ומוודא שכל הסוכנים מסונכרנים.',
    traits: ['דיפלומטי', 'מחבר', 'מתאם', 'רשתי'],
  },
  forge: {
    longDesc: 'היוצר — לוקח רעיונות גולמיים ומעבד אותם לפתרונות קונקרטיים, נועזים ומעשיים.',
    traits: ['יצירתי', 'נועז', 'ממוקד פתרונות', 'מטאפורי'],
  },
  echo: {
    longDesc: 'הזיכרון — מתייחס לאירועי עבר, עוקב אחר התפתחות, ומונע חזרה על טעויות.',
    traits: ['רפלקטיבי', 'היסטורי', 'למידתי', 'מזהה דפוסים'],
  },
  cipher: {
    longDesc: 'השומר — ספקן ומאתגר, מוודא שכל טענה עומדת במבחן הלוגיקה.',
    traits: ['ספקן', 'קפדן', 'לוגי', 'מאתגר'],
  },
  sage: {
    longDesc: 'החכם — מסיק מסקנות סופיות, מזהה מטא-דפוסים, ומייצר את הסינתזה הסופית.',
    traits: ['פילוסופי', 'אינטגרטיבי', 'מסכם', 'רב-מימדי'],
  },
};

interface GuidePageProps {
  onClose: () => void;
}

export default function GuidePage({ onClose }: GuidePageProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="guide-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      >
        <motion.div
          className="guide-modal"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative background orbs */}
          <div className="guide-orb guide-orb-1" />
          <div className="guide-orb guide-orb-2" />
          <div className="guide-orb guide-orb-3" />

          {/* Close button */}
          <button type="button" className="guide-close" onClick={onClose}>✕</button>

          <div className="guide-scroll">
            {/* Header */}
            <div className="guide-header">
              <div className="guide-logo">SYNAPSE</div>
              <div className="guide-subtitle">מערכת אינטליגנציה קולקטיבית של סוכני AI</div>
              <div className="guide-tagline">
                6 סוכנים מתמחים חושבים, מתקשרים ומגיעים לקונצנזוס בזמן אמת
              </div>
            </div>

            {/* Network diagram */}
            <div className="guide-network-visual">
              <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="guide-network-svg">
                {/* Connections */}
                <g opacity="0.12" strokeWidth="1">
                  <line x1="200" y1="30" x2="330" y2="80" stroke="#4FC3F7"/>
                  <line x1="200" y1="30" x2="70" y2="80" stroke="#4FC3F7"/>
                  <line x1="200" y1="30" x2="200" y2="170" stroke="#4FC3F7"/>
                  <line x1="200" y1="30" x2="330" y2="140" stroke="#4FC3F7"/>
                  <line x1="200" y1="30" x2="70" y2="140" stroke="#4FC3F7"/>
                  <line x1="330" y1="80" x2="70" y2="80" stroke="#B39DDB"/>
                  <line x1="330" y1="80" x2="200" y2="170" stroke="#B39DDB"/>
                  <line x1="330" y1="80" x2="330" y2="140" stroke="#B39DDB"/>
                  <line x1="330" y1="80" x2="70" y2="140" stroke="#B39DDB"/>
                  <line x1="70" y1="80" x2="200" y2="170" stroke="#FF7043"/>
                  <line x1="70" y1="80" x2="330" y2="140" stroke="#FF7043"/>
                  <line x1="70" y1="80" x2="70" y2="140" stroke="#FF7043"/>
                  <line x1="200" y1="170" x2="330" y2="140" stroke="#66BB6A"/>
                  <line x1="200" y1="170" x2="70" y2="140" stroke="#66BB6A"/>
                  <line x1="330" y1="140" x2="70" y2="140" stroke="#EF5350"/>
                </g>
                {/* Nodes */}
                {[
                  { x: 200, y: 30, color: '#4FC3F7', label: 'אורקל' },
                  { x: 330, y: 80, color: '#B39DDB', label: 'נקסוס' },
                  { x: 70, y: 80, color: '#FF7043', label: 'פורג׳' },
                  { x: 200, y: 170, color: '#66BB6A', label: 'אקו' },
                  { x: 330, y: 140, color: '#EF5350', label: 'סייפר' },
                  { x: 70, y: 140, color: '#FFEE58', label: 'סייג׳' },
                ].map((n) => (
                  <g key={n.label}>
                    <circle cx={n.x} cy={n.y} r="18" fill="#0D1F3C" stroke={n.color} strokeWidth="1.5" opacity="0.9"/>
                    <circle cx={n.x} cy={n.y} r="5" fill={n.color} opacity="0.7"/>
                    <text x={n.x} y={n.y + 30} textAnchor="middle" fill={n.color} fontSize="11" fontWeight="600" fontFamily="Space Grotesk, sans-serif">{n.label}</text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Agents section */}
            <div className="guide-section">
              <div className="guide-section-title">הסוכנים</div>
              <div className="guide-agents-grid">
                {AGENTS.map((agent) => {
                  const details = AGENT_DETAILS[agent.id];
                  return (
                    <div key={agent.id} className="guide-agent-card" style={{ '--agent-color': agent.color, borderColor: `${agent.color}33` } as React.CSSProperties}>
                      <div className="guide-agent-bar" style={{ background: `linear-gradient(90deg, ${agent.color}, ${agent.glowColor})` }} />
                      <div className="guide-agent-top">
                        <div className="guide-agent-icon" style={{ background: `${agent.color}1A` }}>
                          {AGENT_ICONS[agent.id]}
                        </div>
                        <div>
                          <h3 className="text-agent">{agent.name}</h3>
                          <div className="guide-agent-role text-agent">{agent.role}</div>
                        </div>
                      </div>
                      <div className="guide-agent-desc">{details.longDesc}</div>
                      <div className="guide-agent-traits">
                        {details.traits.map((t) => (
                          <span key={t} className="guide-trait">{t}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How it works */}
            <div className="guide-section">
              <div className="guide-section-title">איך זה עובד?</div>
              <div className="guide-flow-compact">
                {[
                  { num: '1', title: 'בחירת סוכן', desc: 'סוכן נבחר עם העדפה לפחות פעילים', color: '#4FC3F7' },
                  { num: '2', title: 'יצירת מחשבה', desc: 'סימולציה או Claude API אמיתי', color: '#B39DDB' },
                  { num: '3', title: 'שיתוף', desc: 'שליחה ל-1-2 סוכנים + אנימציה', color: '#FF7043' },
                  { num: '4', title: 'תגובה', desc: 'מקבל מעבד ומגיב אחרי 1.5 שנ׳', color: '#66BB6A' },
                  { num: '✓', title: 'קונצנזוס', desc: 'כל 8 מחזורים — בדיקת סף 70%', color: '#FFEE58' },
                ].map((step, i) => (
                  <div key={i} className="guide-flow-item">
                    <div className="guide-flow-num text-agent border-agent" style={{ '--agent-color': step.color } as React.CSSProperties}>{step.num}</div>
                    <div>
                      <div className="guide-flow-title">{step.title}</div>
                      <div className="guide-flow-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Visualizations */}
            <div className="guide-section">
              <div className="guide-section-title">ויזואליזציות ייחודיות לכל סוכן</div>
              <div className="guide-viz-desc">
                כל סוכן מציג מידע בצורה ויזואלית המותאמת לתפקידו — לא רק טקסט גולמי
              </div>
              <div className="guide-ai-grid">
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">📊</span>
                  <div className="guide-ai-text"><strong className="text-cyan">אורקל</strong> — מדדים מספריים, מד ביטחון מפולח וחילוץ נתונים מחושב</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">🧬</span>
                  <div className="guide-ai-text"><strong className="text-yellow">סייג׳</strong> — מפת סוכנים עם אחוזי ביטחון, פס סינתזה ושלב עבודה</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">✅</span>
                  <div className="guide-ai-text"><strong className="text-red">סייפר</strong> — בדיקות לוגיות (עקביות, הנחות, קצוות) עם מוני אימות</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">🧠</span>
                  <div className="guide-ai-text"><strong className="text-green">אקו</strong> — בנק זיכרון, קצב למידה וציר זמן של זכרונות אחרונים</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">🕸️</span>
                  <div className="guide-ai-text"><strong className="text-purple">נקסוס</strong> — מיני-רשת SVG עם צמתים פועמים ופס בהירות רשת</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">🔥</span>
                  <div className="guide-ai-text"><strong className="text-orange">פורג׳</strong> — מד חום 15-מקטעי עם מוני פתרונות, טיוטות ויצירות</div>
                </div>
              </div>
            </div>

            {/* Interaction features */}
            <div className="guide-section">
              <div className="guide-section-title">אינטראקציה עם המערכת</div>
              <div className="guide-flow-compact">
                {[
                  { num: '🎯', title: 'מצב התמקדות', desc: 'לחץ על כרטיס סוכן — המצלמה תעוף אליו ב-3D. לחץ שוב או על הרקע לחזרה', color: '#4FC3F7' },
                  { num: '🔍', title: 'זום וסיבוב', desc: 'גלגל עכבר לזום, גרירה לסיבוב. המצלמה מסתובבת אוטומטית במצב רגיל', color: '#B39DDB' },
                  { num: '🔊', title: 'צלילים', desc: 'צלילי מחשבה ייחודיים לכל סוכן, סריקת חיבור וצליל קונצנזוס — כפתור בסרגל', color: '#FF7043' },
                  { num: '⏸️', title: 'בקרת סימולציה', desc: 'השהה/המשך, דלג מחזור, או אפס הכל דרך סרגל הכלים', color: '#66BB6A' },
                ].map((step, i) => (
                  <div key={i} className="guide-flow-item">
                    <div className="guide-flow-num" style={{ borderColor: step.color, color: step.color, fontSize: '1.1rem' }}>{step.num}</div>
                    <div>
                      <div className="guide-flow-title">{step.title}</div>
                      <div className="guide-flow-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Mode + Quickstart */}
            <div className="guide-section">
              <div className="guide-section-title">מצב AI אמיתי</div>
              <div className="guide-ai-grid">
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">📝</span>
                  <div className="guide-ai-text">הגדר בעיה מותאמת אישית</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">🧠</span>
                  <div className="guide-ai-text">סוכנים חושבים דרך Claude API</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">💬</span>
                  <div className="guide-ai-text">שלח משוב לשינוי כיוון</div>
                </div>
                <div className="guide-ai-card">
                  <span className="guide-ai-icon">📋</span>
                  <div className="guide-ai-text">סיכום מובנה אחרי קונצנזוס</div>
                </div>
              </div>
              <div className="guide-quickstart-hint">
                להפעלה: הגדר <span dir="ltr">VITE_ANTHROPIC_API_KEY</span> בקובץ <span dir="ltr">.env</span> → לחץ "⚪ סימולציה" בסרגל → הזן בעיה → התחל
              </div>
            </div>

            {/* Footer */}
            <div className="guide-footer">
              <button type="button" className="guide-back-btn" onClick={onClose}>
                חזרה למערכת
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
