import React, { useState, useEffect, useCallback } from 'react';
import { Key, BarChart2, Sparkles, AlertCircle, EyeOff, Eye, Save, RefreshCw, CheckCircle } from 'lucide-react';
import AdminPageWrapper from '../../components/AdminPageWrapper';
import './APIKeys.css';

// Python API Base URL (uses same API Gateway as main app)
const PYTHON_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

interface ApiKeyInfo {
  key_name: string;
  has_value: boolean;
  masked_value: string;
  source: 'mongodb' | 'env' | 'none';
  updated_at?: string;
  updated_by?: string;
}

interface ApiKeysData {
  gemini: ApiKeyInfo;
  youtube: ApiKeyInfo;
}

const APIKeys: React.FC = () => {
  // API Key States
  const [apiKeysData, setApiKeysData] = useState<ApiKeysData | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Model selection (static for now, only gemini-2.0-flash supported)
  const selectedModel = 'gemini-2.0-flash';

  // Fetch API keys from backend
  const fetchApiKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${PYTHON_API_URL}/api/v1/settings/api-keys`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (json.success && json.data) {
        setApiKeysData(json.data);
        // Don't overwrite user input - only set placeholders if empty
        if (!geminiApiKey && json.data.gemini?.masked_value) {
          setGeminiApiKey(json.data.gemini.masked_value);
        }
        if (!youtubeApiKey && json.data.youtube?.masked_value) {
          setYoutubeApiKey(json.data.youtube.masked_value);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, [geminiApiKey, youtubeApiKey]);

  // Initial load
  useEffect(() => {
    fetchApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save API keys to MongoDB
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Only send keys that have been modified (not masked values)
      const body: Record<string, string> = {};

      if (geminiApiKey && !geminiApiKey.includes('...') && geminiApiKey !== apiKeysData?.gemini?.masked_value) {
        body.gemini_api_key = geminiApiKey;
      }

      if (youtubeApiKey && !youtubeApiKey.includes('...') && youtubeApiKey !== apiKeysData?.youtube?.masked_value) {
        body.youtube_api_key = youtubeApiKey;
      }

      if (Object.keys(body).length === 0) {
        setError('No changes to save. Enter new key values to update.');
        setIsSaving(false);
        return;
      }

      const response = await fetch(`${PYTHON_API_URL}/api/v1/settings/api-keys`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (json.success) {
        setSuccessMessage('API keys updated successfully!');
        setApiKeysData(json.data);
        // Reset inputs to show masked values
        setGeminiApiKey(json.data?.gemini?.masked_value || '');
        setYoutubeApiKey(json.data?.youtube?.masked_value || '');

        // Clear success message after 3s
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to show masked values from server
  const handleReset = () => {
    if (apiKeysData) {
      setGeminiApiKey(apiKeysData.gemini?.masked_value || '');
      setYoutubeApiKey(apiKeysData.youtube?.masked_value || '');
    }
    setError(null);
    setSuccessMessage(null);
  };

  if (isLoading) {
    return (
      <AdminPageWrapper title="Integration Configuration">
        <div className="flex items-center justify-center h-64 text-slate-400">
          <RefreshCw size={24} className="animate-spin mr-2" />
          <span>Loading API settings...</span>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Integration Configuration">
      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="integration-config-section">
        <p className="config-subtitle" style={{ textAlign: 'center', marginBottom: '24px', color: '#5f6368', fontSize: '14px' }}>
          Configure external services and APIs
        </p>

        {/* Google Gemini API Configuration */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-title-wrapper">
              <Sparkles size={20} className="config-icon gemini-icon" />
              <h3>Google Gemini API</h3>
            </div>
          </div>

          <div className="config-content">
            <div className="form-group">
              <label htmlFor="gemini-api-key">API Key</label>
              <div className="input-with-toggle">
                <input
                  id="gemini-api-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="config-input"
                  placeholder="Enter your Gemini API key"
                />
                <button
                  className="toggle-visibility-btn"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  type="button"
                >
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small className="text-slate-400" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Enter a new key to update. Masked values (***) indicate stored keys.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="model-selection">Model Selection</label>
              <select
                id="model-selection"
                value={selectedModel}
                disabled
                className="config-select"
              >
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              </select>
              <small className="text-slate-400" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Model is fixed to gemini-2.0-flash for this application.
              </small>
            </div>
          </div>
        </div>

        {/* YouTube API Configuration */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-title-wrapper">
              <Key size={20} className="config-icon external-icon" />
              <h3>YouTube API</h3>
            </div>
          </div>

          <div className="config-content">
            <div className="form-group">
              <label htmlFor="youtube-api-key">YouTube API Key</label>
              <div className="input-with-toggle">
                <input
                  id="youtube-api-key"
                  type={showYoutubeKey ? 'text' : 'password'}
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  className="config-input"
                  placeholder="Enter YouTube API key"
                />
                <button
                  className="toggle-visibility-btn"
                  onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                  type="button"
                >
                  {showYoutubeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="config-actions">
          <button
            className="btn-save-changes"
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
          <button
            className="btn-reset"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default APIKeys;
