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
    longDesc: 'אורקל הוא העיניים האנליטיות של הקבוצה — סורק נתונים, מזהה מגמות, ומספק הערכות כמותיות לגבי הבעיה הנבחנת.',
    traits: ['אנליטי', 'מדויק', 'הסתברותי', 'מבוסס נתונים'],
  },
  nexus: {
    longDesc: 'נקסוס הוא הדיפלומט של הקבוצה — מחבר בין תובנות שונות, מתאם עמדות, ומוודא שכל הסוכנים מסונכרנים.',
    traits: ['דיפלומטי', 'מחבר', 'מתאם', 'רשתי'],
  },
  forge: {
    longDesc: 'פורג׳ הוא היוצר של הקבוצה — לוקח רעיונות גולמיים ומעבד אותם לפתרונות קונקרטיים, נועזים ומעשיים.',
    traits: ['יצירתי', 'נועז', 'ממוקד פתרונות', 'מטאפורי'],
  },
  echo: {
    longDesc: 'אקו הוא הזיכרון של הקבוצה — מתייחס לאירועי עבר, עוקב אחר התפתחות, ומונע חזרה על טעויות.',
    traits: ['רפלקטיבי', 'היסטורי', 'למידתי', 'מזהה דפוסים'],
  },
  cipher: {
    longDesc: 'סייפר הוא השומר של הקבוצה — ספקן ומאתגר, מוודא שכל טענה עומדת במבחן הלוגיקה לפני שהיא מתקבלת.',
    traits: ['ספקן', 'קפדן', 'לוגי', 'מאתגר'],
  },
  sage: {
    longDesc: 'סייג׳ הוא החכם של הקבוצה — מסיק מסקנות סופיות, מזהה מטא-דפוסים, ומייצר את הסינתזה הסופית.',
    traits: ['פילוסופי', 'אינטגרטיבי', 'מסכם', 'רב-מימדי'],
  },
};

const FLOW_STEPS = [
  { title: 'בחירת סוכן', desc: 'המנוע בוחר סוכן עם העדפה לסוכנים שלא היו פעילים לאחרונה (שקלול ריבועי). זה מבטיח חלוקה הוגנת של זמן חשיבה.' },
  { title: 'יצירת מחשבה', desc: 'הסוכן מייצר מחשבה — במצב סימולציה מתוך תבניות, ובמצב AI אמיתי דרך קריאה ל-Claude API עם הקשר שיחה מלא.' },
  { title: 'שיתוף ותקשורת', desc: 'המחשבה נשלחת ל-1-2 סוכנים. קרן תקשורת מואירה ברשת התלת-ממדית, ורמת הביטחון של שני הצדדים עולה.' },
  { title: 'תגובת מקבל', desc: 'אחרי 1.5 שניות, הסוכן המקבל מעבד את ההודעה ומייצר תגובה משלו — שרשרת חשיבה מתפתחת.' },
  { title: 'בדיקת קונצנזוס', desc: 'כל 8 מחזורים: סייג׳ מבקש סינתזה → נקסוס מרכז → סייפר מאמת. אם כל הסוכנים מעל 70% — קונצנזוס הושג!' },
];

interface GuidePageProps {
  onClose: () => void;
}

export default function GuidePage({ onClose }: GuidePageProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="guide-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="guide-scroll">
          {/* Header */}
          <div className="guide-hero">
            <button type="button" className="guide-close" onClick={onClose}>✕</button>
            <div className="guide-logo">SYNAPSE</div>
            <div className="guide-subtitle">מערכת אינטליגנציה קולקטיבית של סוכני AI</div>
            <div className="guide-tagline">
              6 סוכנים מתמחים חושבים, מתקשרים ומגיעים לקונצנזוס בזמן אמת
            </div>
          </div>

          {/* What is Synapse */}
          <div className="guide-section">
            <div className="guide-section-title">מה זה סינאפס?</div>
            <div className="guide-divider" />
            <p className="guide-section-desc">
              סינאפס הוא כלי ויזואליזציה לאינטליגנציה קולקטיבית של סוכני AI. המערכת מדמה רשת של 6 סוכנים
              מתמחים שעובדים יחד כדי לנתח בעיות מורכבות, לשתף תובנות, ולהגיע להסכמה — הכל בזמן אמת עם
              ויזואליזציה תלת-ממדית.
            </p>

            <div className="guide-layout-diagram">
              <div className="guide-layout-zone" style={{ borderColor: 'rgba(79, 195, 247, 0.3)' }}>
                <div className="guide-zone-icon">📊</div>
                <h5 style={{ color: '#4FC3F7' }}>לוח בקרה</h5>
                <p>כרטיסי סוכנים, גרף למידה, יומן קונצנזוס, הזנת בעיה</p>
              </div>
              <div className="guide-layout-zone" style={{ borderColor: 'rgba(206, 147, 216, 0.3)' }}>
                <div className="guide-zone-icon">💬</div>
                <h5 style={{ color: '#CE93D8' }}>זרם מחשבות</h5>
                <p>כל ההודעות והתובנות בין הסוכנים בזמן אמת</p>
              </div>
              <div className="guide-layout-zone" style={{ borderColor: 'rgba(255, 213, 79, 0.3)' }}>
                <div className="guide-zone-icon">🌐</div>
                <h5 style={{ color: '#FFD54F' }}>רשת תלת-ממדית</h5>
                <p>ויזואליזציה של הסוכנים, חיבורים, ואנימציות תקשורת</p>
              </div>
            </div>
          </div>

          {/* Agents */}
          <div className="guide-section">
            <div className="guide-section-title">הסוכנים</div>
            <div className="guide-divider" />
            <p className="guide-section-desc">
              כל סוכן מתמחה בתחום ספציפי ותורם פרספקטיבה ייחודית לפתרון הבעיה.
              ביחד הם מהווים מוח קולקטיבי שלם.
            </p>

            <div className="guide-agents-grid">
              {AGENTS.map((agent) => {
                const details = AGENT_DETAILS[agent.id];
                return (
                  <motion.div
                    key={agent.id}
                    className="guide-agent-card"
                    style={{ borderColor: `${agent.color}33` }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="guide-agent-bar" style={{ background: `linear-gradient(90deg, ${agent.color}, ${agent.glowColor})` }} />
                    <div className="guide-agent-icon" style={{ background: `${agent.color}1A` }}>
                      {AGENT_ICONS[agent.id]}
                    </div>
                    <h3 style={{ color: agent.color }}>{agent.name}</h3>
                    <div className="guide-agent-id">{agent.id.toUpperCase()}</div>
                    <div className="guide-agent-role" style={{ color: agent.color }}>{agent.role}</div>
                    <div className="guide-agent-desc">{details.longDesc}</div>
                    <div className="guide-agent-traits">
                      {details.traits.map((t) => (
                        <span key={t} className="guide-trait">{t}</span>
                      ))}
                    </div>
                    <div className="guide-agent-personality" style={{ color: agent.color, borderColor: `${agent.color}4D` }}>
                      {agent.personality}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="guide-section">
            <div className="guide-section-title">איך זה עובד?</div>
            <div className="guide-divider" />
            <p className="guide-section-desc">
              מנוע הסימולציה רץ במחזורים של 4 שניות. בכל מחזור, סוכן נבחר לחשוב,
              משתף את התובנה שלו, וכל 8 מחזורים מתבצעת בדיקת קונצנזוס.
            </p>

            <div className="guide-flow-steps">
              {FLOW_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  className="guide-flow-step"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <div className="guide-step-num">{i + 1}</div>
                  <div className="guide-step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Phase 2 */}
          <div className="guide-section">
            <div className="guide-section-title">מצב AI אמיתי</div>
            <div className="guide-divider" />
            <p className="guide-section-desc">
              במצב AI, הסוכנים חושבים באמת דרך Claude API — כל מחשבה, תגובה, וסיכום נוצרים על ידי מודל שפה
              אמיתי עם הקשר שיחה מלא.
            </p>

            <div className="guide-features-grid">
              {[
                { icon: '📝', title: 'הזנת בעיה', desc: 'הגדר בעיה מותאמת אישית — הסוכנים יעבדו עליה עם AI אמיתי' },
                { icon: '🧠', title: 'חשיבה אמיתית', desc: 'כל סוכן מקבל prompt עם התפקיד, האישיות, ו-15 הודעות הקשר' },
                { icon: '💬', title: 'לולאת משוב', desc: 'שלח משוב בזמן אמת — הסוכנים ישנו כיוון ויחשבו מחדש' },
                { icon: '📋', title: 'סיכום מובנה', desc: 'אחרי קונצנזוס, סייג׳ מייצר סיכום עם תובנות, פתרון, וסיכונים' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="guide-feature"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  <div className="guide-feature-icon">{f.icon}</div>
                  <h5>{f.title}</h5>
                  <p>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Visual Dynamics */}
          <div className="guide-section">
            <div className="guide-section-title">דינמיקה ויזואלית</div>
            <div className="guide-divider" />
            <p className="guide-section-desc">
              הוויזואליזציה משתנה בזמן אמת בהתאם למצב הסוכנים — ככל שהביטחון עולה, התצוגה מתעצמת.
            </p>

            <div className="guide-features-grid">
              {[
                { icon: '⬤', title: 'גודל הכדור', desc: 'גדל מ-0.2 (ביטחון 0%) ל-0.4 (ביטחון 100%)' },
                { icon: '✨', title: 'עוצמת זוהר', desc: 'זוהר גובר מ-0.3 ל-1.1 עם עליית הביטחון' },
                { icon: '💫', title: 'הילת אור', desc: 'הילה שקופה מתרחבת סביב כל סוכן עם ביטחון גבוה' },
                { icon: '🌐', title: 'טבעת מסלול', desc: 'טבעת סובבת שמאיצה ככל שהביטחון עולה' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="guide-feature"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  <div className="guide-feature-icon">{f.icon}</div>
                  <h5>{f.title}</h5>
                  <p>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quickstart */}
          <div className="guide-section">
            <div className="guide-section-title">התחלה מהירה</div>
            <div className="guide-divider" />

            <div className="guide-quickstart">
              {[
                { text: 'המערכת רצה אוטומטית במצב סימולציה — אין צורך בהגדרות' },
                { text: 'להפעלת AI אמיתי: הגדר VITE_ANTHROPIC_API_KEY בקובץ .env' },
                { text: 'לחץ על כפתור "⚪ סימולציה" בסרגל העליון כדי לעבור ל-"🔴 AI פעיל"' },
                { text: 'הזן בעיה בשדה הטקסט ולחץ "התחל פתרון"' },
                { text: 'בזמן שהסוכנים עובדים, ניתן לשלוח משוב לכיוון אחר' },
              ].map((s, i) => (
                <div key={i} className="guide-qs-step">
                  <div className="guide-qs-num">{i + 1}</div>
                  <div>{s.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="guide-footer">
            <p>סינאפס — אינטליגנציה קולקטיבית של סוכני AI</p>
            <p>React 19 + Three.js + TypeScript + Claude API</p>
            <button type="button" className="guide-back-btn" onClick={onClose}>
              חזרה למערכת
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
