import { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore, type Message } from '../../store/useSimStore';

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
                className={`thought-entry ${isUserMsg ? 'thought-entry-user' : ''}`}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="thought-entry-header">
                  <span className="text-muted" dir="ltr">[{time}]</span>{' '}
                  {isUserMsg ? (
                    <span className="text-cyan">משתמש</span>
                  ) : (
                    <>
                      <span className="text-agent" style={{ '--agent-color': sender?.color } as React.CSSProperties}>{sender?.name}</span>
                      <span className="text-muted"> ← </span>
                      {receivers.map((r, i) => (
                        <span key={r!.id}>
                          {i > 0 && <span className="text-muted">,</span>}
                          <span className="text-agent" style={{ '--agent-color': r!.color } as React.CSSProperties}>{r!.name}</span>
                        </span>
                      ))}
                    </>
                  )}
                </div>
                <div className="thought-entry-text">"{msg.text}"</div>
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
