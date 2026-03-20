export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
  glowColor: string;
  position: [number, number, number];
  personality: string;
  avatar: string;
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
    position: [0, 3.8, 0],
    personality: 'אנליטי, מדויק, מדבר בהסתברויות',
    avatar: 'agents/oracle.png',
  },
  {
    id: 'nexus',
    name: 'נקסוס',
    role: 'תקשורת ותיאום',
    description: 'מנתב מידע בין סוכנים ומנהל קונצנזוס',
    color: '#B39DDB',
    glowColor: '#4527A0',
    position: [3.3, 0.8, 2.7],
    personality: 'דיפלומטי, מחבר, תמיד מתייחס לסוכנים אחרים',
    avatar: 'agents/nexus.png',
  },
  {
    id: 'forge',
    name: 'פורג׳',
    role: 'יצירת פתרונות',
    description: 'ממזג רעיונות לפתרונות מעשיים',
    color: '#FF7043',
    glowColor: '#BF360C',
    position: [-3.3, 0.8, 2.7],
    personality: 'יצירתי, נועז, ממוקד פתרונות, משתמש במטאפורות',
    avatar: 'agents/forge.png',
  },
  {
    id: 'echo',
    name: 'אקו',
    role: 'זיכרון ולמידה',
    description: 'שומר על ההיסטוריה הקולקטיבית ומזהה דפוסי למידה',
    color: '#66BB6A',
    glowColor: '#2E7D32',
    position: [0, -3.8, 0],
    personality: 'רפלקטיבי, מתייחס לאירועי עבר, עוקב אחר התפתחות',
    avatar: 'agents/echo.png',
  },
  {
    id: 'cipher',
    name: 'סייפר',
    role: 'אימות ואבטחה',
    description: 'מאמת מסקנות ומזהה חוסר עקביות לוגי',
    color: '#EF5350',
    glowColor: '#B71C1C',
    position: [3.3, -0.8, -2.7],
    personality: 'ספקן, קפדן, מאתגר הנחות יסוד',
    avatar: 'agents/cipher.png',
  },
  {
    id: 'sage',
    name: 'סייג׳',
    role: 'חוכמה וסינתזה',
    description: 'משלב את כל הפרספקטיבות למסקנות ברמה גבוהה',
    color: '#FFEE58',
    glowColor: '#F9A825',
    position: [-3.3, -0.8, -2.7],
    personality: 'פילוסופי, אינטגרטיבי, מסיק מסקנות סופיות',
    avatar: 'agents/sage.png',
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
