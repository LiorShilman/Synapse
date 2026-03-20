import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore, type Message } from '../../store/useSimStore';

const BASE = import.meta.env.BASE_URL;

/** Group messages with same sender+text within 500ms into one entry */
interface GroupedMessage {
  id: string;
  fromId: string;
  toIds: string[];
  text: string;
  timestamp: number;
}

function groupMessages(messages: Message[]): GroupedMessage[] {
  const result: GroupedMessage[] = [];
  for (const msg of messages) {
    const prev = result[result.length - 1];
    if (
      prev &&
      prev.fromId === msg.fromId &&
      prev.text === msg.text &&
      Math.abs(prev.timestamp - msg.timestamp) < 500
    ) {
      prev.toIds.push(msg.toId);
    } else {
      result.push({
        id: msg.id,
        fromId: msg.fromId,
        toIds: [msg.toId],
        text: msg.text,
        timestamp: msg.timestamp,
      });
    }
  }
  return result;
}

export default function ThoughtStream() {
  const messages = useSimStore((s) => s.messages);
  const agents = useSimStore((s) => s.agents);
  const containerRef = useRef<HTMLDivElement>(null);
  const grouped = useMemo(() => groupMessages(messages), [messages]);

  // Feature 6: Agent filter
  const [filterAgentId, setFilterAgentId] = useState<string | null>(null);

  const filteredGrouped = useMemo(() => {
    if (!filterAgentId) return grouped;
    return grouped.filter(
      (msg) => msg.fromId === filterAgentId || msg.toIds.includes(filterAgentId)
    );
  }, [grouped, filterAgentId]);

  // Feature 1: Auto-scroll + "back to latest" button
  // Messages are prepended (newest first), so "top" = latest.
  const [isScrolledAway, setIsScrolledAway] = useState(false);
  const prevMessageCountRef = useRef(messages.length);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // If scrollTop > small threshold, user has scrolled away from top
    setIsScrolledAway(el.scrollTop > 40);
  }, []);

  // Auto-scroll to top when new messages arrive (if user hasn't scrolled away)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !isScrolledAway) {
      const el = containerRef.current;
      if (el) el.scrollTop = 0;
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isScrolledAway]);

  const scrollToLatest = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
      setIsScrolledAway(false);
    }
  }, []);

  // Feature 2: Find which agents are currently thinking
  const thinkingAgentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, state] of Object.entries(agents)) {
      if (state.isThinking) ids.add(id);
    }
    return ids;
  }, [agents]);

  return (
    <div className="thought-stream">
      <div className="thought-stream-header">
        <span>זרם מחשבות</span>
        {/* Feature 6: Agent filter chips */}
        <div className="ts-filter-bar">
          {AGENTS.map((agent) => (
            <button
              type="button"
              key={agent.id}
              className={`ts-filter-chip ${filterAgentId === agent.id ? 'ts-filter-active' : ''}`}
              onClick={() => setFilterAgentId(filterAgentId === agent.id ? null : agent.id)}
              title={`סנן לפי ${agent.name}`}
              style={{ '--agent-color': agent.color } as React.CSSProperties}
            >
              <img src={`${BASE}${agent.avatar}`} alt={agent.name} className="ts-filter-avatar" />
            </button>
          ))}
          {filterAgentId && (
            <button type="button" className="ts-filter-clear" onClick={() => setFilterAgentId(null)}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table header */}
      <div className="ts-table-head">
        <div className="ts-col-time">שעה</div>
        <div className="ts-col-from">שולח</div>
        <div className="ts-col-arrow" />
        <div className="ts-col-to">נמען</div>
        <div className="ts-col-msg">הודעה</div>
      </div>

      <div className="thought-stream-list" ref={containerRef} onScroll={handleScroll}>
        <AnimatePresence initial={false}>
          {filteredGrouped.map((msg, idx) => {
            const isUserMsg = msg.fromId === 'user';
            const sender = AGENTS.find((a) => a.id === msg.fromId);
            const receivers = msg.toIds
              .map((id) => AGENTS.find((a) => a.id === id))
              .filter(Boolean);
            const time = new Date(msg.timestamp).toLocaleTimeString('he-IL', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            // Feature 2: Is this the most recent row from a currently-thinking agent?
            const isActiveRow =
              !isUserMsg &&
              thinkingAgentIds.has(msg.fromId) &&
              idx === filteredGrouped.findIndex((m) => m.fromId === msg.fromId);

            return (
              <motion.div
                key={msg.id}
                className={`ts-row ${isUserMsg ? 'ts-row-user' : ''} ${isActiveRow ? 'ts-row-active' : ''}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={!isUserMsg && sender ? { '--row-color': sender.color } as React.CSSProperties : undefined}
              >
                {/* Time */}
                <div className="ts-col-time ts-time" dir="ltr">{time}</div>

                {/* Sender */}
                <div className="ts-col-from">
                  {isUserMsg ? (
                    <div className="ts-agent-chip ts-user-chip">
                      <span className="ts-agent-icon">👤</span>
                      <span>משתמש</span>
                    </div>
                  ) : sender ? (
                    <div className="ts-agent-chip" style={{ '--agent-color': sender.color } as React.CSSProperties}>
                      <img
                        src={`${BASE}${sender.avatar}`}
                        alt={sender.name}
                        className="ts-avatar"
                      />
                      <span className="text-agent">{sender.name}</span>
                    </div>
                  ) : null}
                </div>

                {/* Arrow */}
                <div className="ts-col-arrow">
                  {!isUserMsg && <span className="ts-arrow">←</span>}
                </div>

                {/* Receivers */}
                <div className="ts-col-to">
                  {!isUserMsg && receivers.map((r, i) => (
                    <div key={r!.id} className="ts-agent-chip ts-agent-chip-small" style={{ '--agent-color': r!.color } as React.CSSProperties}>
                      <img src={`${BASE}${r!.avatar}`} alt={r!.name} className="ts-avatar ts-avatar-sm" />
                      <span className="text-agent">{r!.name}</span>
                      {i < receivers.length - 1 && <span className="ts-comma">,</span>}
                    </div>
                  ))}
                </div>

                {/* Message text */}
                <div className="ts-col-msg ts-msg-text">"{msg.text}"</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="thought-stream-empty">
            ממתין לשידור ראשון...
          </div>
        )}
      </div>

      {/* Feature 1: Back to latest button */}
      {isScrolledAway && (
        <button type="button" className="ts-back-to-latest" onClick={scrollToLatest}>
          ↑ חזרה לאחרון
        </button>
      )}
    </div>
  );
}
