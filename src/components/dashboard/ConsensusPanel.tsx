import { useSimStore } from '../../store/useSimStore';

export default function ConsensusPanel() {
  const events = useSimStore((s) => s.consensusEvents);
  const globalConfidence = useSimStore((s) => s.globalConfidence);

  const recentEvents = events.slice(-3).reverse();

  return (
    <div className="consensus-panel">
      <div className="consensus-panel-header">
        יומן קונצנזוס
        <span className="consensus-threshold">
          סף: 70% | נוכחי: {globalConfidence}%
        </span>
      </div>
      <div className="consensus-list">
        {recentEvents.length === 0 && (
          <div className="consensus-empty">
            אין אירועי קונצנזוס עדיין — הסוכנים עדיין מתכנסים...
          </div>
        )}
        {recentEvents.map((event) => (
          <div
            key={event.id}
            className={`consensus-event ${event.active ? 'active' : ''}`}
          >
            <span className="consensus-icon">⬡</span>
            <span className="consensus-text">{event.insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
