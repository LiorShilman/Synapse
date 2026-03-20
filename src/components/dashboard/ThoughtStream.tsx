import { useRef, useMemo } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const grouped = useMemo(() => groupMessages(messages), [messages]);

  return (
    <div className="thought-stream">
      <div className="thought-stream-header">זרם מחשבות</div>

      {/* Table header */}
      <div className="ts-table-head">
        <div className="ts-col-time">שעה</div>
        <div className="ts-col-from">שולח</div>
        <div className="ts-col-arrow" />
        <div className="ts-col-to">נמען</div>
        <div className="ts-col-msg">הודעה</div>
      </div>

      <div className="thought-stream-list" ref={containerRef}>
        <AnimatePresence initial={false}>
          {grouped.map((msg) => {
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

            return (
              <motion.div
                key={msg.id}
                className={`ts-row ${isUserMsg ? 'ts-row-user' : ''}`}
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
    </div>
  );
}
