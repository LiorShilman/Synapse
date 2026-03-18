import { useState, useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { toggleAudio, updateAmbientTone } from '../../hooks/useSynapseAudio';

interface StatusBarProps {
  onOpenGuide: () => void;
  onOpenSettings: () => void;
}

export default function StatusBar({ onOpenGuide, onOpenSettings }: StatusBarProps) {
  const tickCount = useSimStore((s) => s.tickCount);
  const startTime = useSimStore((s) => s.startTime);
  const globalConfidence = useSimStore((s) => s.globalConfidence);
  const currentProblem = useSimStore((s) => s.currentProblem);
  const isApiMode = useSimStore((s) => s.isApiMode);
  const mode = useSimStore((s) => s.mode);
  const [audioOn, setAudioOn] = useState(false);

  // Update ambient tone when confidence changes
  useEffect(() => {
    updateAmbientTone(globalConfidence);
  }, [globalConfidence]);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  const handleToggleApi = () => {
    const store = useSimStore.getState();
    if (!isApiMode && !store.llmConfig.apiKey) {
      onOpenSettings();
      return;
    }
    store.setApiMode(!isApiMode);
  };

  return (
    <div className="status-bar">
      <div className="status-bar-right">
        <span className="status-logo">סינאפס</span>
        <span className="status-dots">●●●</span>
        <button
          type="button"
          className={`api-toggle ${isApiMode ? 'api-toggle-active' : ''}`}
          onClick={handleToggleApi}
          title={isApiMode ? 'מצב AI אמיתי — לחץ לכיבוי' : 'מצב סימולציה — לחץ להפעלת AI'}
        >
          {isApiMode ? '🔴 AI פעיל' : '⚪ סימולציה'}
        </button>
        <button
          type="button"
          className="settings-toggle"
          onClick={onOpenSettings}
          title="הגדרות LLM"
        >
          ⚙
        </button>
      </div>
      <div className="status-bar-center">
        <span className="status-item">
          מחזור <span className="status-value">{tickCount}</span>
        </span>
        <span className="status-item">
          ⏱ <span className="status-value" dir="ltr">{minutes}:{seconds}</span>
        </span>
        <span className="status-item">
          ביטחון{' '}
          <span className="status-value">{globalConfidence}%</span>
        </span>
        {mode === 'solving' && (
          <span className="status-item status-solving">
            פותר בעיה
          </span>
        )}
      </div>
      <div className="status-bar-left">
        <span className="status-problem">{currentProblem}</span>
        <button
          type="button"
          className={`audio-toggle ${audioOn ? 'audio-toggle-active' : ''}`}
          onClick={() => {
            const next = !audioOn;
            setAudioOn(next);
            toggleAudio(next);
          }}
          title={audioOn ? 'כבה צלילים' : 'הפעל צלילים'}
        >
          {audioOn ? '🔊' : '🔇'}
        </button>
        <button
          type="button"
          className="guide-toggle"
          onClick={onOpenGuide}
          title="מדריך למשתמש"
        >
          ?
        </button>
      </div>
    </div>
  );
}
