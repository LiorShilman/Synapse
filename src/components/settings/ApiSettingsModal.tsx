import { useState } from 'react';
import { useSimStore, type LlmProvider, type LlmConfig } from '../../store/useSimStore';

const DEFAULT_ENDPOINTS: Record<LlmProvider, string> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com',
};

const DEFAULT_MODELS: Record<LlmProvider, string[]> = {
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'],
  openai: ['gpt-5.4', 'gpt-5.4-thinking', 'gpt-5.3-instant', 'gpt-5.2', 'gpt-4o'],
};

interface Props {
  onClose: () => void;
}

export default function ApiSettingsModal({ onClose }: Props) {
  const llmConfig = useSimStore((s) => s.llmConfig);
  const setLlmConfig = useSimStore((s) => s.setLlmConfig);

  const [provider, setProvider] = useState<LlmProvider>(llmConfig.provider);
  const [apiKey, setApiKey] = useState(llmConfig.apiKey);
  const [model, setModel] = useState(llmConfig.model);
  const [endpoint, setEndpoint] = useState(llmConfig.endpoint);
  const isInitialCustom = !DEFAULT_MODELS[llmConfig.provider].includes(llmConfig.model);
  const [customModel, setCustomModel] = useState(isInitialCustom ? llmConfig.model : '');
  const [showKey, setShowKey] = useState(false);

  const isCustomModel = !DEFAULT_MODELS[provider].includes(model);

  const handleProviderChange = (p: LlmProvider) => {
    setProvider(p);
    setEndpoint(DEFAULT_ENDPOINTS[p]);
    setModel(DEFAULT_MODELS[p][0]);
    setCustomModel('');
  };

  const handleSave = () => {
    const config: LlmConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: customModel || model,
      endpoint: endpoint.trim(),
    };
    setLlmConfig(config);
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>הגדרות LLM</h2>
          <button type="button" className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Provider */}
          <label className="settings-label">ספק</label>
          <div className="settings-provider-tabs">
            <button
              type="button"
              className={`provider-tab ${provider === 'anthropic' ? 'provider-tab-active' : ''}`}
              onClick={() => handleProviderChange('anthropic')}
            >
              Anthropic
            </button>
            <button
              type="button"
              className={`provider-tab ${provider === 'openai' ? 'provider-tab-active' : ''}`}
              onClick={() => handleProviderChange('openai')}
            >
              OpenAI / תואם
            </button>
          </div>

          {/* API Key */}
          <label className="settings-label">מפתח API</label>
          <div className="settings-key-row">
            <input
              type={showKey ? 'text' : 'password'}
              className="settings-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              dir="ltr"
            />
            <button
              type="button"
              className="settings-eye"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'הסתר' : 'הצג'}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>

          {/* Endpoint */}
          <label className="settings-label">
            Endpoint
            <span className="settings-hint">
              {provider === 'openai' ? ' (ניתן לשנות ל-LLM פנימי)' : ''}
            </span>
          </label>
          <input
            type="text"
            className="settings-input"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            dir="ltr"
            placeholder={DEFAULT_ENDPOINTS[provider]}
          />

          {/* Model */}
          <label className="settings-label">מודל</label>
          <select
            className="settings-select"
            aria-label="בחירת מודל"
            value={isCustomModel ? '__custom__' : model}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setCustomModel(model);
              } else {
                setModel(e.target.value);
                setCustomModel('');
              }
            }}
            dir="ltr"
          >
            {DEFAULT_MODELS[provider].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="__custom__">מודל מותאם אישית...</option>
          </select>
          {(isCustomModel || customModel) && (
            <input
              type="text"
              className="settings-input settings-custom-model"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="שם המודל"
              dir="ltr"
            />
          )}
        </div>

        <div className="settings-footer">
          <button type="button" className="settings-btn settings-btn-save" onClick={handleSave}>
            שמור
          </button>
          <button type="button" className="settings-btn settings-btn-cancel" onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
