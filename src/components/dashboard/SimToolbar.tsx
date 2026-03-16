import { useSimStore } from '../../store/useSimStore';
import { downloadReport } from '../../utils/generateReportHtml';

export default function SimToolbar() {
  const isApiMode = useSimStore((s) => s.isApiMode);
  const simPaused = useSimStore((s) => s.simPaused);
  const consensusEvents = useSimStore((s) => s.consensusEvents);
  const hasConsensus = consensusEvents.length > 0;

  // Only show in simulation mode (not API mode)
  if (isApiMode || !hasConsensus) return null;

  const handleResume = () => {
    useSimStore.getState().setSimPaused(false);
  };

  const handleSave = () => {
    downloadReport({
      reportTitle: 'דוח סימולציה',
      reportSubtitle: 'מצב סימולציה — מחשבות מבוססות תבניות',
      filePrefix: 'sim',
    });
  };

  return (
    <div className="sim-toolbar">
      <span className="sim-toolbar-text">
        {simPaused ? '⏸ הסימולציה הושהתה — הושג קונצנזוס' : `✓ הושג קונצנזוס (${consensusEvents.length})`}
      </span>
      {simPaused && (
        <button className="problem-btn problem-btn-resume" onClick={handleResume}>
          ▶ המשך
        </button>
      )}
      <button className="problem-btn problem-btn-save" onClick={handleSave} title="שמור דוח סימולציה">
        💾 שמור
      </button>
    </div>
  );
}
