import { THOUGHT_TEMPLATES } from '../agents/thoughtTemplates';
import { AGENTS } from '../agents/agentDefinitions';
import { useSimStore } from '../store/useSimStore';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Global API Rate Limiter ───
// Anthropic free tier: 30,000 input tokens/min.
// Each call ~900-2000 tokens → space calls ≥3.5s apart (max ~17 calls/min ≈ 20K tokens)
const API_MIN_INTERVAL_MS = 3500;
let apiLastCallTime = 0;
const apiQueue: Array<{
  fn: () => Promise<string | null>;
  resolve: (v: string | null) => void;
  priority: number; // higher = more important
}> = [];
let apiQueueRunning = false;

async function drainApiQueue() {
  if (apiQueueRunning) return;
  apiQueueRunning = true;
  while (apiQueue.length > 0) {
    // Sort by priority descending so consensus summary goes first
    apiQueue.sort((a, b) => b.priority - a.priority);
    const item = apiQueue.shift()!;
    const now = Date.now();
    const elapsed = now - apiLastCallTime;
    if (elapsed < API_MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, API_MIN_INTERVAL_MS - elapsed));
    }
    apiLastCallTime = Date.now();
    try {
      const result = await item.fn();
      item.resolve(result);
    } catch {
      item.resolve(null);
    }
  }
  apiQueueRunning = false;
}

const API_QUEUE_MAX = 6; // max queued items — drop lowest-priority if full

function enqueueApiCall(fn: () => Promise<string | null>, priority = 0): Promise<string | null> {
  return new Promise((resolve) => {
    // If queue is full, drop the lowest-priority item (resolve it as null)
    if (apiQueue.length >= API_QUEUE_MAX) {
      apiQueue.sort((a, b) => b.priority - a.priority);
      const dropped = apiQueue.pop();
      if (dropped) dropped.resolve(null);
    }
    apiQueue.push({ fn, resolve, priority });
    drainApiQueue();
  });
}

export function getSimulatedThought(
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
  // Get recent messages involving this agent (limit to 6 to reduce token usage)
  const relevantMessages = store.messages
    .filter((m) => m.fromId === agentId || m.toId === agentId || m.fromId === 'user')
    .slice(0, 6);

  if (relevantMessages.length === 0) return '';

  const lines = relevantMessages
    .reverse()
    .map((m) => {
      const fromDef = AGENTS.find((a) => a.id === m.fromId);
      const fromName = m.fromId === 'user' ? 'משתמש' : (fromDef?.name ?? m.fromId);
      return `[${fromName}]: ${m.text.slice(0, 200)}`;
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

async function callLlmApi(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string | null> {
  const { provider, apiKey, model, endpoint } = useSimStore.getState().llmConfig;

  if (provider === 'openai') {
    const url = `${endpoint.replace(/\/+$/, '')}/v1/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  }

  // Anthropic (default)
  const url = `${endpoint.replace(/\/+$/, '')}/v1/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.content?.[0]?.text ?? null;
}

// ─── Streaming API for consensus summary ───

async function callLlmApiStreaming(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  onChunk: (text: string) => void
): Promise<string | null> {
  const { provider, apiKey, model, endpoint } = useSimStore.getState().llmConfig;

  if (provider === 'openai') {
    const url = `${endpoint.replace(/\/+$/, '')}/v1/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    if (!response.ok) return null;

    const reader = response.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder();
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
        try {
          const json = JSON.parse(line.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onChunk(full);
          }
        } catch { /* skip malformed lines */ }
      }
    }
    return full || null;
  }

  // Anthropic streaming
  const url = `${endpoint.replace(/\/+$/, '')}/v1/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!response.ok) return null;

  const reader = response.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === 'content_block_delta' && json.delta?.text) {
          full += json.delta.text;
          onChunk(full);
        }
      } catch { /* skip malformed lines */ }
    }
  }
  return full || null;
}

async function callAgentAPI(
  agentId: string,
  context: { currentProblem: string; otherAgentIds: string[] }
): Promise<string> {
  const systemPrompt = buildSystemPrompt(agentId);
  const conversationContext = buildConversationContext(agentId);

  const userMessage = conversationContext
    ? `חשוב על הבעיה הבאה: ${context.currentProblem}${conversationContext}`
    : `חשוב על הבעיה הבאה: ${context.currentProblem}`;

  try {
    // Queue with normal priority — rate limiter spaces calls apart
    const result = await enqueueApiCall(
      () => callLlmApi(systemPrompt, userMessage, 200),
      0
    );
    return result ?? getSimulatedThought(agentId, context);
  } catch {
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

  // Trim messages to avoid oversized payload; limit each to 200 chars, max 8 messages
  const recentMessages = store.messages
    .slice(0, 8)
    .reverse()
    .map((m) => {
      const fromDef = AGENTS.find((a) => a.id === m.fromId);
      const fromName = m.fromId === 'user' ? 'משתמש' : (fromDef?.name ?? m.fromId);
      return `[${fromName}]: ${m.text.slice(0, 200)}`;
    })
    .join('\n');

  const systemPrompt = `אתה סייג׳, סוכן הסינתזה והחוכמה ברשת סינאפס.
תפקידך לסכם את התובנות של כל הסוכנים לסיכום מובנה וברור.

הנחיות:
- כתוב בעברית תקנית
- צור סיכום מובנה עם הכותרות הבאות (בדיוק):
  ## ניתוח הבעיה
  ## תובנות עיקריות
  ## 🎯 שורה תחתונה — המלצת המערכת
  ## סיכוני ביצוע
- בסעיף "שורה תחתונה" כתוב תשובה חד-משמעית וברורה לשאלה/דילמה. אל תתחמק — גם אם הנושא מורכב, המערכת חייבת לספק המלצה ברורה עם הנמקה
- ציין תרומה ייחודית של כל סוכן
- סיכום של 200-400 מילים`;

  // Build a structured local fallback from agent state
  const agentLines = AGENTS.map((a) => {
    const state = store.agents[a.id];
    return `- **${a.name}** (${a.role}, ביטחון ${state?.confidence ?? 0}%): ${state?.currentThought ?? '—'}`;
  }).join('\n');

  // Find the most substantive AI-generated messages (filter out template/consensus noise)
  const noisePatterns = ['מחזור', 'מטא-אסטרטגי', 'בדיקת קונצנזוס', 'מרכז תובנות:', 'אימות לוגי', 'שומר קונצנזוס:', 'סוקר את מצב', 'אתה יוזם', 'אתה מרכז', 'אתה מאמת', 'אתה שומר'];
  const substantiveMessages = store.messages
    .filter((m) => m.text.length > 80 && !noisePatterns.some((p) => m.text.startsWith(p)))
    .slice(0, 6)
    .map((m) => {
      const fromDef = AGENTS.find((a) => a.id === m.fromId);
      return `- **${fromDef?.name ?? m.fromId}**: ${m.text.slice(0, 400)}`;
    }).join('\n');

  const apiNote = store.isApiMode
    ? 'קריאת ה-API לסיכום נכשלה — להלן תובנות הסוכנים מהדיון.'
    : 'לסיכום מפורט יותר עם המלצה חד-משמעית, הפעל מצב AI אמיתי.';
  const localFallback = `# סיכום קונצנזוס: ${store.currentProblem}\n\n## תובנות מרכזיות מהדיון\n${substantiveMessages || '(לא נמצאו תובנות מהותיות)'}\n\n## תובנות הסוכנים\n${agentLines}\n\n## 🎯 שורה תחתונה\nהסוכנים הגיעו להסכמה קולקטיבית עם ביטחון ממוצע של ${store.globalConfidence}%. ${apiNote}`;

  const userMessage = `סכם את תהליך פתרון הבעיה הבאה:

בעיה: ${store.currentProblem}

מצב הסוכנים:
${agentThoughts}

היסטוריית דיון:
${recentMessages}`;

  // Use the rate-limited queue with high priority, then stream the response
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 15000));
      }
      // Wait in queue for our turn, then stream
      useSimStore.getState().setIsStreaming(true);
      const result = await enqueueApiCall(
        () => callLlmApiStreaming(systemPrompt, userMessage, 1200, (partial) => {
          // Update store progressively — UI updates in real-time
          useSimStore.getState().setSolutionSummary(partial);
        }),
        10 // high priority — jumps ahead of queued agent calls
      );
      useSimStore.getState().setIsStreaming(false);
      if (result) return result;
    } catch {
      useSimStore.getState().setIsStreaming(false);
      // continue to retry or fallback
    }
  }
  return localFallback;
}

export async function generateConsensusThought(
  _agentId: string,
  role: 'initiate' | 'coordinate' | 'validate-pass' | 'validate-fail' | 'store'
): Promise<string> {
  const store = useSimStore.getState();

  const fallbacks: Record<string, string> = {
    'initiate': `בדיקת קונצנזוס: סוקר את מצב הדיון בנושא ${store.currentProblem}`,
    'coordinate': `מרכז תובנות: מזהה נקודות הסכמה בין הסוכנים בנושא ${store.currentProblem}`,
    'validate-pass': `אימות לוגי הושלם ✓ — הטיעונים עקביים ומבוססים`,
    'validate-fail': `אימות לוגי: סף הביטחון טרם הושג — נדרש דיון נוסף`,
    'store': `שומר קונצנזוס: התובנות בנושא ${store.currentProblem} נשמרו בזיכרון הקולקטיבי`,
  };

  // Always use fallbacks for consensus-phase thoughts to preserve API budget
  // for the important consensus summary call (avoids rate limiting)
  return fallbacks[role] ?? 'מעבד...';
}

/** Generate a reply from receiverId specifically responding to senderThought (API mode only) */
export async function generateReply(
  receiverId: string,
  senderId: string,
  senderThought: string,
  context: { currentProblem: string; otherAgentIds: string[] }
): Promise<string> {
  const store = useSimStore.getState();

  if (!(store.isApiMode && store.mode === 'solving')) {
    return getSimulatedThought(receiverId, context);
  }

  const senderDef = AGENTS.find((a) => a.id === senderId);
  const senderName = senderDef?.name ?? senderId;
  const systemPrompt = buildSystemPrompt(receiverId);
  const conversationContext = buildConversationContext(receiverId);

  const userMessage = `הבעיה: ${context.currentProblem}

${senderName} אמר/ה: "${senderThought.slice(0, 300)}"

הגב/י ספציפית לתובנה של ${senderName}. האם אתה מסכים? יש לך נקודת מבט שונה? מה אתה יכול להוסיף מתחום המומחיות שלך?${conversationContext}`;

  try {
    const result = await enqueueApiCall(
      () => callLlmApi(systemPrompt, userMessage, 200),
      1 // slightly higher than normal sender priority
    );
    return result ?? getSimulatedThought(receiverId, context);
  } catch {
    return getSimulatedThought(receiverId, context);
  }
}

export async function generateThought(
  agentId: string,
  context: { currentProblem: string; otherAgentIds: string[] }
): Promise<string> {
  const store = useSimStore.getState();

  if (store.isApiMode && store.mode === 'solving') {
    return callAgentAPI(agentId, context);
  }

  return getSimulatedThought(agentId, context);
}

export function getThoughtCategory(agentId: string): string {
  const templates = THOUGHT_TEMPLATES[agentId];
  if (!templates) return 'discovery';
  return pickRandom(templates).category;
}
