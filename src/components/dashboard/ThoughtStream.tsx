import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';

export default function ThoughtStream() {
  const messages = useSimStore((s) => s.messages);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="thought-stream">
      <div className="thought-stream-header">זרם מחשבות</div>
      <div className="thought-stream-list" ref={containerRef}>
        <AnimatePresence initial={false}>
          {messages.slice(0, 30).map((msg) => {
            const isUserMsg = msg.fromId === 'user';
            const sender = AGENTS.find((a) => a.id === msg.fromId);
            const receiver = AGENTS.find((a) => a.id === msg.toId);
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
                  <span style={{ color: '#4A6A8A' }} dir="ltr">[{time}]</span>{' '}
                  {isUserMsg ? (
                    <span style={{ color: '#4FC3F7' }}>משתמש</span>
                  ) : (
                    <>
                      <span style={{ color: sender?.color }}>{sender?.name}</span>
                      <span style={{ color: '#4A6A8A' }}> ← </span>
                      <span style={{ color: receiver?.color }}>{receiver?.name}</span>
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
