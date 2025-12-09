// src/pages/Configuration.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { ConfigSettings } from '../../types';
import { Database, Sparkles, Settings, Info, CheckCircle, AlertCircle, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import AdminPageWrapper from './components/AdminPageWrapper';
import configurationService from '../../service/configurationService';
import './Configuration.css';

// Default config values - used as fallback when API is unavailable
const DEFAULT_CONFIG: ConfigSettings = {
  database: {
    sqlServerHost: 'localhost',
    sqlServerMaxConnections: 100,
    mongodbUri: 'mongodb://localhost:27017',
    mongodbPoolSize: 50,
    elasticsearchUrl: 'http://localhost:9200'
  },
  gemini: {
    apiKey: '**********************',
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40
  },
  application: {
    sessionTimeout: 60,
    dailyQuestionLimit: 100,
    websocketPort: 8000,
    apiRateLimit: 60,
    cacheExpiry: 24,
    enableEmailNotifications: true,
    enableRealtimeMonitoring: true
  },
  integrations: {
    youtubeApiKey: '',
    githubApiToken: '',
    stackOverflowApiKey: '',
    enableAutoFetch: false
  }
};

export const Configuration: React.FC = () => {
  const [config, setConfig] = useState<ConfigSettings | null>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load configuration from backend on mount
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await configurationService.getConfigurationSettings();

      setConfig({
        database: {
          sqlServerHost: settings.database['database.sqlserver.host'] || DEFAULT_CONFIG.database.sqlServerHost,
          sqlServerMaxConnections: parseInt(settings.database['database.sqlserver.max_connections'] || String(DEFAULT_CONFIG.database.sqlServerMaxConnections)),
          mongodbUri: settings.database['database.mongodb.uri'] || DEFAULT_CONFIG.database.mongodbUri,
          mongodbPoolSize: parseInt(settings.database['database.mongodb.pool_size'] || String(DEFAULT_CONFIG.database.mongodbPoolSize)),
          elasticsearchUrl: settings.database['database.elasticsearch.url'] || DEFAULT_CONFIG.database.elasticsearchUrl,
        },
        gemini: {
          apiKey: settings.gemini['gemini.api_key'] || DEFAULT_CONFIG.gemini.apiKey,
          model: settings.gemini['gemini.model'] || DEFAULT_CONFIG.gemini.model,
          temperature: parseFloat(settings.gemini['gemini.temperature'] || String(DEFAULT_CONFIG.gemini.temperature)),
          maxTokens: parseInt(settings.gemini['gemini.max_tokens'] || String(DEFAULT_CONFIG.gemini.maxTokens)),
          topP: parseFloat(settings.gemini['gemini.top_p'] || String(DEFAULT_CONFIG.gemini.topP)),
          topK: parseInt(settings.gemini['gemini.top_k'] || String(DEFAULT_CONFIG.gemini.topK)),
        },
        application: {
          sessionTimeout: parseInt(settings.application['application.session_timeout'] || String(DEFAULT_CONFIG.application.sessionTimeout)),
          dailyQuestionLimit: parseInt(settings.application['application.daily_question_limit'] || String(DEFAULT_CONFIG.application.dailyQuestionLimit)),
          websocketPort: parseInt(settings.application['application.websocket_port'] || String(DEFAULT_CONFIG.application.websocketPort)),
          apiRateLimit: parseInt(settings.application['application.api_rate_limit'] || String(DEFAULT_CONFIG.application.apiRateLimit)),
          cacheExpiry: parseInt(settings.application['application.cache_expiry'] || String(DEFAULT_CONFIG.application.cacheExpiry)),
          enableEmailNotifications: settings.application['application.enable_email_notifications'] === 'true',
          enableRealtimeMonitoring: settings.application['application.enable_realtime_monitoring'] === 'true',
        },
        integrations: DEFAULT_CONFIG.integrations,
      });
    } catch (error) {
      console.warn('Failed to load config from API, using defaults:', error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = async (section: keyof ConfigSettings, formData: Record<string, unknown>) => {
    setSaving(true);
    let allSuccess = true;

    try {
      const keyMappings: Record<string, Record<string, string>> = {
        database: {
          sqlServerHost: 'database.sqlserver.host',
          sqlServerMaxConnections: 'database.sqlserver.max_connections',
          mongodbUri: 'database.mongodb.uri',
          mongodbPoolSize: 'database.mongodb.pool_size',
          elasticsearchUrl: 'database.elasticsearch.url',
        },
        gemini: {
          apiKey: 'gemini.api_key',
          model: 'gemini.model',
          temperature: 'gemini.temperature',
          maxTokens: 'gemini.max_tokens',
          topP: 'gemini.top_p',
          topK: 'gemini.top_k',
        },
        application: {
          sessionTimeout: 'application.session_timeout',
          dailyQuestionLimit: 'application.daily_question_limit',
          websocketPort: 'application.websocket_port',
          apiRateLimit: 'application.api_rate_limit',
          cacheExpiry: 'application.cache_expiry',
          enableEmailNotifications: 'application.enable_email_notifications',
          enableRealtimeMonitoring: 'application.enable_realtime_monitoring',
        },
      };

      const mappings = keyMappings[section] || {};

      for (const [fieldName, value] of Object.entries(formData)) {
        const settingKey = mappings[fieldName];
        if (settingKey) {
          const success = await configurationService.updateSetting(settingKey, String(value));
          if (!success) {
            allSuccess = false;
          }
        }
      }

      setConfig(prev => prev ? ({ ...prev, [section]: formData }) : null);
    } catch (error) {
      console.error('Failed to update config:', error);
      allSuccess = false;
    }

    setSaving(false);
    return { success: allSuccess };
  };

  const handleSaveConfig = async (section: keyof ConfigSettings, formData: any) => {
    const result = await updateConfig(section, formData);

    if (result.success) {
      setSuccessMessage(`Configuration ${section} saved successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage('Unable to save configuration');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  if (loading || !config) {
    return (
      <AdminPageWrapper title="System Configuration">
        <div className="sc-loading">
          <RefreshCw size={24} className="sc-loading-spinner" />
          <span>Loading configuration...</span>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="System Configuration">
      <div className="sc-container">
        {/* Info Box */}
        <div className="sc-info-box">
          <div className="sc-info-icon">
            <Info size={20} />
          </div>
          <div className="sc-info-content">
            <strong>Configuration Options:</strong> Settings can be edited through the admin interface.
            Changes are saved to the system configuration file.
          </div>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <div className="sc-message sc-message-success">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="sc-message sc-message-error">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cards Grid */}
        <div className="sc-cards-grid">
          {/* Database Configuration */}
          <DatabaseConfigCard
            config={config.database}
            onSave={(data) => handleSaveConfig('database', data)}
            saving={saving}
          />

          {/* Gemini API Configuration */}
          <GeminiConfigCard
            config={config.gemini}
            onSave={(data) => handleSaveConfig('gemini', data)}
            saving={saving}
          />

          {/* Application Settings - Full Width */}
          <ApplicationConfigCard
            config={config.application}
            onSave={(data) => handleSaveConfig('application', data)}
            saving={saving}
          />
        </div>
      </div>
    </AdminPageWrapper>
  );
};

// Database Configuration Card Component
const DatabaseConfigCard: React.FC<{
  config: ConfigSettings['database'];
  onSave: (data: any) => void;
  saving: boolean;
}> = ({ config, onSave, saving }) => {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="sc-config-card">
      <div className="sc-card-header">
        <div className="sc-card-title-wrapper">
          <div className="sc-card-icon database">
            <Database size={24} />
          </div>
          <h3 className="sc-card-title">Database Configuration</h3>
        </div>
        <span className="sc-status-badge full-control">Full Control</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="sc-card-content">
          <div className="sc-form-group">
            <label className="sc-form-label">SQL Server Host</label>
            <input
              type="text"
              className="sc-form-input"
              value={formData.sqlServerHost}
              onChange={(e) => setFormData({ ...formData, sqlServerHost: e.target.value })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">SQL Server Max Connections</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.sqlServerMaxConnections}
              onChange={(e) => setFormData({ ...formData, sqlServerMaxConnections: parseInt(e.target.value) })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">MongoDB URI</label>
            <input
              type="text"
              className="sc-form-input"
              value={formData.mongodbUri}
              onChange={(e) => setFormData({ ...formData, mongodbUri: e.target.value })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">MongoDB Connection Pool Size</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.mongodbPoolSize}
              onChange={(e) => setFormData({ ...formData, mongodbPoolSize: parseInt(e.target.value) })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Elasticsearch URL</label>
            <input
              type="text"
              className="sc-form-input"
              value={formData.elasticsearchUrl}
              onChange={(e) => setFormData({ ...formData, elasticsearchUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="sc-card-footer">
          <button type="submit" className="sc-btn sc-btn-primary" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw size={18} className="sc-loading-spinner" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Database Configuration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Gemini Configuration Card Component
const GeminiConfigCard: React.FC<{
  config: ConfigSettings['gemini'];
  onSave: (data: any) => void;
  saving: boolean;
}> = ({ config, onSave, saving }) => {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="sc-config-card">
      <div className="sc-card-header">
        <div className="sc-card-title-wrapper">
          <div className="sc-card-icon gemini">
            <Sparkles size={24} />
          </div>
          <h3 className="sc-card-title">Gemini API Configuration</h3>
        </div>
        <span className="sc-status-badge limited">Parameters Only</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="sc-card-content">
          <div className="sc-form-group">
            <label className="sc-form-label">Gemini API Key</label>
            <input
              type="password"
              className="sc-form-input"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            />
            <span className="sc-helper-text success">✓ Can change API key</span>
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Model Selection</label>
            <select
              className="sc-form-select"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended)</option>
              <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-flash-8b">gemini-1.5-flash-8b</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              <option value="gemini-2.5-flash-preview-05-20">gemini-2.5-flash-preview (Latest)</option>
            </select>
            <span className="sc-helper-text success">✓ Can select available models</span>
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Temperature (0.0 - 1.0)</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.temperature}
              step="0.1"
              min="0"
              max="1"
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            />
            <span className="sc-helper-text success">✓ Can adjust creativity level</span>
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Max Output Tokens</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
            />
            <span className="sc-helper-text success">✓ Can set response length limit</span>
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Top P (Nucleus Sampling)</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.topP}
              step="0.05"
              min="0"
              max="1"
              onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Top K</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.topK}
              onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) })}
            />
          </div>

          {/* Info Note */}
          <div className="sc-info-note">
            <AlertTriangle size={18} className="sc-info-note-icon" />
            <span className="sc-info-note-text">
              <strong>Note:</strong> Cannot modify Gemini's internal architecture, training data,
              or infrastructure. These parameters control how we USE the API.
            </span>
          </div>
        </div>

        <div className="sc-card-footer">
          <button type="submit" className="sc-btn sc-btn-primary" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw size={18} className="sc-loading-spinner" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Gemini Config
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Application Configuration Card Component
const ApplicationConfigCard: React.FC<{
  config: ConfigSettings['application'];
  onSave: (data: any) => void;
  saving: boolean;
}> = ({ config, onSave, saving }) => {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="sc-config-card">
      <div className="sc-card-header">
        <div className="sc-card-title-wrapper">
          <div className="sc-card-icon application">
            <Settings size={24} />
          </div>
          <h3 className="sc-card-title">Application Settings</h3>
        </div>
        <span className="sc-status-badge full-control">Full Control</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="sc-card-content">
          <div className="sc-form-group">
            <label className="sc-form-label">Session Timeout (minutes)</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.sessionTimeout}
              onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Daily Question Limit per Student</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.dailyQuestionLimit}
              onChange={(e) => setFormData({ ...formData, dailyQuestionLimit: parseInt(e.target.value) })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">WebSocket Port</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.websocketPort}
              onChange={(e) => setFormData({ ...formData, websocketPort: parseInt(e.target.value) })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">API Rate Limit (requests/min)</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.apiRateLimit}
              onChange={(e) => setFormData({ ...formData, apiRateLimit: parseInt(e.target.value) })}
            />
          </div>
          <div className="sc-form-group">
            <label className="sc-form-label">Cache Expiration (hours)</label>
            <input
              type="number"
              className="sc-form-input"
              value={formData.cacheExpiry}
              onChange={(e) => setFormData({ ...formData, cacheExpiry: parseInt(e.target.value) })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label
              className="sc-checkbox-group"
              onClick={() => setFormData({ ...formData, enableEmailNotifications: !formData.enableEmailNotifications })}
            >
              <input
                type="checkbox"
                className="sc-checkbox"
                checked={formData.enableEmailNotifications}
                onChange={(e) => setFormData({ ...formData, enableEmailNotifications: e.target.checked })}
              />
              <span className="sc-checkbox-label">Enable email notifications</span>
            </label>
            <label
              className="sc-checkbox-group"
              onClick={() => setFormData({ ...formData, enableRealtimeMonitoring: !formData.enableRealtimeMonitoring })}
            >
              <input
                type="checkbox"
                className="sc-checkbox"
                checked={formData.enableRealtimeMonitoring}
                onChange={(e) => setFormData({ ...formData, enableRealtimeMonitoring: e.target.checked })}
              />
              <span className="sc-checkbox-label">Enable real-time monitoring</span>
            </label>
          </div>
        </div>

        <div className="sc-card-footer">
          <button type="submit" className="sc-btn sc-btn-primary" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw size={18} className="sc-loading-spinner" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Application Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
