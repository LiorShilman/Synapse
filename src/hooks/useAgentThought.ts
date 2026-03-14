import { THOUGHT_TEMPLATES } from '../agents/thoughtTemplates';
import { AGENTS } from '../agents/agentDefinitions';
import { useSimStore } from '../store/useSimStore';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSimulatedThought(
  agentId: string,
  context: { currentProblem: string; otherAgentIds: string[] }
): string {
  const templates = THOUGHT_TEMPLATES[agentId];
  if (!templates || templates.length === 0) return 'מעבד...';

  const template = pickRandom(templates);
  const otherAgent = pickRandom(context.otherAgentIds);
  const otherDef = AGENTS.find((a) => a.id === otherAgent);
  const confidence = Math.floor(60 + Math.random() * 35);

  return template.template
    .replace(/{problem}/g, context.currentProblem.toLowerCase())
    .replace(/{agent}/g, otherDef?.name ?? 'סוכן')
    .replace(/{confidence}/g, String(confidence));
}

function buildConversationContext(agentId: string): string {
  const store = useSimStore.getState();
  // Get recent messages involving this agent (last 15 messages for deeper context)
  const relevantMessages = store.messages
    .filter((m) => m.fromId === agentId || m.toId === agentId || m.fromId === 'user')
    .slice(0, 15);

  if (relevantMessages.length === 0) return '';

  const lines = relevantMessages
    .reverse()
    .map((m) => {
      const fromDef = AGENTS.find((a) => a.id === m.fromId);
      const fromName = m.fromId === 'user' ? 'משתמש' : (fromDef?.name ?? m.fromId);
      return `[${fromName}]: ${m.text}`;
    });

  return '\n\nהיסטוריית שיחה אחרונה:\n' + lines.join('\n');
}

function buildSystemPrompt(agentId: string): string {
  const agentDef = AGENTS.find((a) => a.id === agentId);
  if (!agentDef) return '';

  const store = useSimStore.getState();
  const otherAgents = AGENTS.filter((a) => a.id !== agentId)
    .map((a) => `${a.name} (${a.role})`)
    .join(', ');

  return `אתה ${agentDef.name}, סוכן AI המתמחה ב${agentDef.role}.
תפקידך: ${agentDef.description}
אישיות: ${agentDef.personality}

אתה חלק מרשת אינטליגנציה קולקטיבית של 6 סוכנים: ${otherAgents}.

הבעיה הנוכחית: ${store.currentProblem}

הנחיות:
- ענה תמיד בעברית תקנית
- תגובה של 1-3 משפטים מקסימום
- הישאר באופי הסוכן שלך
- התייחס לתובנות של סוכנים אחרים כשרלוונטי
- שמור על רמת ביטחון של ${store.agents[agentId]?.confidence ?? 50}%
- אם יש משוב מהמשתמש, התייחס אליו בכובד ראש
- אם חסר לך מידע קריטי לניתוח (מספרים, נתונים, הקשר חשוב), התחל את התשובה עם התג [שאלה למשתמש: ...] ובתוכו שאלה ממוקדת למשתמש. השתמש בזה רק כשבאמת חסר מידע חיוני${store.noMoreQuestions ? '\n- חשוב מאוד: המשתמש ביקש לא לשאול עוד שאלות. אל תשתמש בתג [שאלה למשתמש]. עבוד עם הנתונים שיש לך והגע למסקנה הטובה ביותר האפשרית.' : ''}`;
}

async function callClaudeAPI(
  agentId: string,
  context: { currentProblem: string; otherAgentIds: string[] }
): Promise<string> {
  const systemPrompt = buildSystemPrompt(agentId);
  const conversationContext = buildConversationContext(agentId);

  const userMessage = conversationContext
    ? `חשוב על הבעיה הבאה: ${context.currentProblem}${conversationContext}`
    : `חשוב על הבעיה הבאה: ${context.currentProblem}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return getSimulatedThought(agentId, context);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API call failed:', error);
    return getSimulatedThought(agentId, context);
  }
}

export async function generateConsensusSummary(): Promise<string> {
  const store = useSimStore.getState();

  // Collect all agent thoughts and recent messages
  const agentThoughts = AGENTS.map((a) => {
    const state = store.agents[a.id];
    return `${a.name} (${a.role}, ביטחון: ${state?.confidence ?? 0}%): ${state?.currentThought ?? 'אין מחשבה'}`;
  }).join('\n');

  const recentMessages = store.messages
    .slice(0, 20)
    .reverse()
    .map((m) => {
      const fromDef = AGENTS.find((a) => a.id === m.fromId);
      const fromName = m.fromId === 'user' ? 'משתמש' : (fromDef?.name ?? m.fromId);
      return `[${fromName}]: ${m.text}`;
    })
    .join('\n');

  const systemPrompt = `אתה סייג׳, סוכן הסינתזה והחוכמה ברשת סינאפס.
תפקידך לסכם את התובנות של כל הסוכנים לסיכום מובנה וברור.

הנחיות:
- כתוב בעברית תקנית
- צור סיכום מובנה עם כותרות
- כלול: ניתוח הבעיה, תובנות עיקריות, פתרון מוצע, סיכוני ביצוע
- ציין תרומה ייחודית של כל סוכן
- סיכום של 150-300 מילים`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `סכם את תהליך פתרון הבעיה הבאה:

בעיה: ${store.currentProblem}

מצב הסוכנים:
${agentThoughts}

היסטוריית דיון:
${recentMessages}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return `סיכום אוטומטי: הסוכנים הגיעו להסכמה בנושא "${store.currentProblem}" עם ביטחון ממוצע של ${store.globalConfidence}%.`;
    }

    const data = await response.json();
    return data.content[0].text;
  } catch {
    return `סיכום אוטומטי: הסוכנים הגיעו להסכמה בנושא "${store.currentProblem}" עם ביטחון ממוצע של ${store.globalConfidence}%.`;
  }
}

export async function generateConsensusThought(
  agentId: string,
  role: 'initiate' | 'coordinate' | 'validate-pass' | 'validate-fail' | 'store'
): Promise<string> {
  const store = useSimStore.getState();
  const agentDef = AGENTS.find((a) => a.id === agentId);
  if (!agentDef) return 'מעבד...';

  const agentThoughts = AGENTS.map((a) => {
    const state = store.agents[a.id];
    return `${a.name} (${a.role}, ביטחון: ${state?.confidence ?? 0}%): ${state?.currentThought ?? 'אין מחשבה'}`;
  }).join('\n');

  const roleInstructions: Record<string, string> = {
    'initiate': 'אתה יוזם בדיקת קונצנזוס. סכם בקצרה את מצב הדיון וקרא לסוכנים האחרים להגיש את התובנות שלהם. התייחס לבעיה הספציפית ולנקודות שעלו.',
    'coordinate': 'אתה מרכז את תהליך הקונצנזוס. תאר אילו נקודות הסכמה ומחלוקת אתה רואה בין הסוכנים, והתייחס לבעיה הספציפית.',
    'validate-pass': 'אתה מאמת את הקונצנזוס. בדוק את הלוגיקה של הטיעונים שהועלו ואשר שהם עומדים בביקורת. ציין נקודות חוזק ספציפיות.',
    'validate-fail': 'אתה מאמת את הקונצנזוס ומצאת שעדיין לא הושג. ציין מה עדיין חסר או לא עקבי בטיעונים, והתייחס לנקודות ספציפיות.',
    'store': 'אתה שומר את הקונצנזוס בזיכרון הקולקטיבי. סכם את התובנה המרכזית שהושגה והסבר למה היא חשובה.',
  };

  if (!(store.isApiMode && store.mode === 'solving')) {
    // Simulation mode fallback
    const fallbacks: Record<string, string> = {
      'initiate': `בדיקת קונצנזוס: סוקר את מצב הדיון בנושא ${store.currentProblem}`,
      'coordinate': `מרכז תובנות: מזהה נקודות הסכמה בין הסוכנים בנושא ${store.currentProblem}`,
      'validate-pass': `אימות לוגי הושלם ✓ — הטיעונים עקביים ומבוססים`,
      'validate-fail': `אימות לוגי: סף הביטחון טרם הושג — נדרש דיון נוסף`,
      'store': `שומר קונצנזוס: התובנות בנושא ${store.currentProblem} נשמרו בזיכרון הקולקטיבי`,
    };
    return fallbacks[role] ?? 'מעבד...';
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: `אתה ${agentDef.name}, סוכן AI המתמחה ב${agentDef.role}.
${roleInstructions[role]}

הבעיה הנוכחית: ${store.currentProblem}

הנחיות:
- ענה תמיד בעברית תקנית
- תגובה של 1-2 משפטים מקסימום
- התייחס לתוכן הספציפי של הדיון, לא במשפטים גנריים`,
        messages: [
          {
            role: 'user',
            content: `מצב הסוכנים כרגע:\n${agentThoughts}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return roleInstructions[role] ?? 'מעבד...';
    }

    const data = await response.json();
    return data.content[0].text;
  } catch {
    return roleInstructions[role] ?? 'מעבד...';
  }
}

export async function generateThought(
  agentId: string,
  context: { currentProblem: string; otherAgentIds: string[] }
): Promise<string> {
  const store = useSimStore.getState();

  if (store.isApiMode && store.mode === 'solving') {
    return callClaudeAPI(agentId, context);
  }

  return getSimulatedThought(agentId, context);
}

export function getThoughtCategory(agentId: string): string {
  const templates = THOUGHT_TEMPLATES[agentId];
  if (!templates) return 'discovery';
  return pickRandom(templates).category;
}
