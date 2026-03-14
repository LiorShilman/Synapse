export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
  glowColor: string;
  position: [number, number, number];
  personality: string;
}

// Octahedron-like layout for true 3D depth
export const AGENTS: AgentDefinition[] = [
  {
    id: 'oracle',
    name: 'אורקל',
    role: 'ניתוח נתונים וחיזוי',
    description: 'מנתח דפוסים ומייצר תחזיות הסתברותיות',
    color: '#4FC3F7',
    glowColor: '#0288D1',
    position: [0, 2.5, 0],
    personality: 'אנליטי, מדויק, מדבר בהסתברויות',
  },
  {
    id: 'nexus',
    name: 'נקסוס',
    role: 'תקשורת ותיאום',
    description: 'מנתב מידע בין סוכנים ומנהל קונצנזוס',
    color: '#CE93D8',
    glowColor: '#7B1FA2',
    position: [2.2, 0.5, 1.8],
    personality: 'דיפלומטי, מחבר, תמיד מתייחס לסוכנים אחרים',
  },
  {
    id: 'forge',
    name: 'פורג׳',
    role: 'יצירת פתרונות',
    description: 'ממזג רעיונות לפתרונות מעשיים',
    color: '#FFAB40',
    glowColor: '#E65100',
    position: [-2.2, 0.5, 1.8],
    personality: 'יצירתי, נועז, ממוקד פתרונות, משתמש במטאפורות',
  },
  {
    id: 'echo',
    name: 'אקו',
    role: 'זיכרון ולמידה',
    description: 'שומר על ההיסטוריה הקולקטיבית ומזהה דפוסי למידה',
    color: '#66BB6A',
    glowColor: '#2E7D32',
    position: [0, -2.5, 0],
    personality: 'רפלקטיבי, מתייחס לאירועי עבר, עוקב אחר התפתחות',
  },
  {
    id: 'cipher',
    name: 'סייפר',
    role: 'אימות ואבטחה',
    description: 'מאמת מסקנות ומזהה חוסר עקביות לוגי',
    color: '#EF9A9A',
    glowColor: '#C62828',
    position: [2.2, -0.5, -1.8],
    personality: 'ספקן, קפדן, מאתגר הנחות יסוד',
  },
  {
    id: 'sage',
    name: 'סייג׳',
    role: 'חוכמה וסינתזה',
    description: 'משלב את כל הפרספקטיבות למסקנות ברמה גבוהה',
    color: '#FFD54F',
    glowColor: '#F57F17',
    position: [-2.2, -0.5, -1.8],
    personality: 'פילוסופי, אינטגרטיבי, מסיק מסקנות סופיות',
  },
];

export const PROBLEM_DOMAINS = [
  'אופטימיזציה של הקצאת משאבים מבוזרת ברשתות דינמיות',
  'חיזוי התנהגות מתעוררת במערכות אדפטיביות מורכבות',
  'פתרון קונפליקטים במסגרות אופטימיזציה רב-מטרתיות',
  'זיהוי שרשראות סיבתיות בזרמי נתונים רב-ממדיים',
  'פיתוח קונצנזוס עמיד בסביבות יריבותיות',
  'סינתזת ידע בין אונטולוגיות בלתי תואמות',
];
