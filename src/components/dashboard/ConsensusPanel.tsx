import { useState } from 'react';
import { useSimStore } from '../../store/useSimStore';

export default function ConsensusPanel() {
  const events = useSimStore((s) => s.consensusEvents);
  const globalConfidence = useSimStore((s) => s.globalConfidence);
  const [expanded, setExpanded] = useState(false);

  const allEvents = [...events].reverse();
  const displayEvents = expanded ? allEvents : allEvents.slice(0, 3);
  const hasMore = allEvents.length > 3;

  return (
    <div className="consensus-panel">
      <div className="consensus-panel-header">
        יומן קונצנזוס
        <span className="consensus-threshold">
          סף: 70% | נוכחי: {globalConfidence}%
        </span>
      </div>
      <div className="consensus-list">
        {allEvents.length === 0 && (
          <div className="consensus-empty">
            אין אירועי קונצנזוס עדיין — הסוכנים עדיין מתכנסים...
          </div>
        )}
        {displayEvents.map((event) => {
          const time = new Date(event.timestamp).toLocaleTimeString('he-IL', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return (
            <div
              key={event.id}
              className={`consensus-event ${event.active ? 'active' : ''}`}
            >
              <span className="consensus-icon">⬡</span>
              <span className="consensus-time" dir="ltr">{time}</span>
              <span className="consensus-text">{event.insight}</span>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          className="consensus-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? `הסתר (${allEvents.length - 3} נוספים)` : `הצג הכל (${allEvents.length})`}
        </button>
      )}
    </div>
  );
}
