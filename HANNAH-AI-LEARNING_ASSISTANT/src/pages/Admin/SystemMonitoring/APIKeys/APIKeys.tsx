import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Youtube, EyeOff, Eye, Save, RefreshCw, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import AdminPageWrapper from '../../components/AdminPageWrapper';
import './APIKeys.css';

// Python API Base URL
const PYTHON_API_URL = 'http://localhost:8001';

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

  // Model selection (static for now)
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
        setGeminiApiKey(json.data?.gemini?.masked_value || '');
        setYoutubeApiKey(json.data?.youtube?.masked_value || '');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to show masked values
  const handleReset = () => {
    if (apiKeysData) {
      setGeminiApiKey(apiKeysData.gemini?.masked_value || '');
      setYoutubeApiKey(apiKeysData.youtube?.masked_value || '');
    }
    setError(null);
    setSuccessMessage(null);
  };

  // Check if API key is configured
  const isGeminiConfigured = apiKeysData?.gemini?.has_value ?? false;
  const isYoutubeConfigured = apiKeysData?.youtube?.has_value ?? false;

  if (isLoading) {
    return (
      <AdminPageWrapper title="Integration Configuration">
        <div className="ic-loading">
          <RefreshCw size={24} className="ic-loading-spinner" />
          <span>Loading API settings...</span>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Integration Configuration">
      <div className="integration-config-container">
        {/* Subtitle Badge */}
        <div style={{ textAlign: 'center' }}>
          <span className="ic-subtitle-badge">Configure external services and APIs</span>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="ic-message ic-message-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="ic-message ic-message-success">
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* API Cards Grid */}
        <div className="ic-cards-grid">
          {/* Google Gemini API Card */}
          <div className="ic-api-card">
            <div className="ic-card-header">
              <div className="ic-card-title-wrapper">
                <div className="ic-card-icon gemini">
                  <Sparkles size={22} />
                </div>
                <h3 className="ic-card-title">Google Gemini API</h3>
              </div>
              <span className={`ic-status-badge ${isGeminiConfigured ? 'configured' : 'not-configured'}`}>
                {isGeminiConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>

            <div className="ic-card-content">
              <div className="ic-form-group">
                <label className="ic-form-label">API Key</label>
                <div className="ic-input-wrapper">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="ic-form-input"
                    placeholder="Enter your Gemini API key"
                  />
                  <button
                    className="ic-toggle-btn"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    type="button"
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="ic-helper-text">
                  Enter a new key to update. Masked values (***) indicate stored keys.
                </span>
              </div>

              <div className="ic-form-group">
                <label className="ic-form-label">Model Selection</label>
                <select
                  value={selectedModel}
                  disabled
                  className="ic-form-select"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                </select>
                <span className="ic-helper-text">
                  Model is fixed to gemini-2.0-flash for this application.
                </span>
              </div>
            </div>
          </div>

          {/* YouTube API Card */}
          <div className="ic-api-card">
            <div className="ic-card-header">
              <div className="ic-card-title-wrapper">
                <div className="ic-card-icon youtube">
                  <Youtube size={22} />
                </div>
                <h3 className="ic-card-title">YouTube API</h3>
              </div>
              <span className={`ic-status-badge ${isYoutubeConfigured ? 'configured' : 'not-configured'}`}>
                {isYoutubeConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>

            <div className="ic-card-content">
              <div className="ic-form-group">
                <label className="ic-form-label">YouTube API Key</label>
                <div className="ic-input-wrapper">
                  <input
                    type={showYoutubeKey ? 'text' : 'password'}
                    value={youtubeApiKey}
                    onChange={(e) => setYoutubeApiKey(e.target.value)}
                    className="ic-form-input"
                    placeholder="Enter YouTube API key"
                  />
                  <button
                    className="ic-toggle-btn"
                    onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                    type="button"
                  >
                    {showYoutubeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="ic-helper-text">
                  Required for video recommendations and YouTube content integration.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="ic-action-bar">
          <div className="ic-action-left">
            <Settings size={16} />
            <span>Action Center</span>
          </div>
          <div className="ic-action-buttons">
            <button
              className="ic-btn ic-btn-primary"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="ic-loading-spinner" />
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
              className="ic-btn ic-btn-secondary"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RefreshCw size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default APIKeys;
