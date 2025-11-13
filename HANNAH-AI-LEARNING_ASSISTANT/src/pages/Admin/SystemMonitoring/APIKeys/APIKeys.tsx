import React, { useState } from 'react';
import { FileText, Key, Copy, DollarSign, BarChart2, MoreVertical, Sparkles, Edit2, AlertCircle, EyeOff, Eye } from 'lucide-react';
import AdminPageWrapper from '../../components/AdminPageWrapper';
import './APIKeys.css';

interface APIKeyItem {
  id: string;
  name: string;
  keyPreview: string;
  project: string;
  projectId: string;
  createdOn: string;
  quotaTier: string;
}

const APIKeys: React.FC = () => {
  const [groupBy, setGroupBy] = useState<'api-key' | 'project'>('api-key');
  const [selectedFilter, setSelectedFilter] = useState('all-projects');
  
  // Integration Configuration States
  const [geminiApiKey, setGeminiApiKey] = useState('AIzaSy...');
  const [selectedModel, setSelectedModel] = useState('gemini-pro');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [maxResults, setMaxResults] = useState('50');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  
  // Mock usage data
  const apiCallsToday = 1247;
  const apiLimit = 10000;

  const [apiKeys] = useState<APIKeyItem[]>([
    {
      id: '1',
      name: 'test',
      keyPreview: '...ft98',
      project: 'test',
      projectId: 'gen-lang-client-0451440085',
      createdOn: 'Oct 19, 2025',
      quotaTier: 'Free tier'
    }
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AdminPageWrapper title="Integration Configuration">
      {/* Integration Configuration Section */}
      <div className="integration-config-section">
        <p className="config-subtitle" style={{textAlign: 'center', marginBottom: '24px', color: '#5f6368', fontSize: '14px'}}>Configure external services and APIs</p>

        {/* Google Gemini API Configuration */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-title-wrapper">
              <Sparkles size={20} className="config-icon gemini-icon" />
              <h3>Google Gemini API</h3>
            </div>
            <button className="test-btn">
              <BarChart2 size={16} />
              Test Connection
            </button>
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
                >
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="model-selection">Model Selection</label>
              <select
                id="model-selection"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="config-select"
              >
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-pro-vision">Gemini Pro Vision</option>
                <option value="gemini-ultra">Gemini Ultra</option>
              </select>
            </div>

            <div className="usage-status">
              <div className="usage-header">
                <AlertCircle size={16} />
                <span>Usage Status</span>
              </div>
              <div className="usage-info">
                <span className="usage-text">API calls today: {apiCallsToday} / {apiLimit.toLocaleString()}</span>
                <div className="usage-bar">
                  <div
                    className="usage-fill"
                    style={{ width: `${(apiCallsToday / apiLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* External APIs Configuration */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-title-wrapper">
              <Key size={20} className="config-icon external-icon" />
              <h3>External APIs</h3>
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
                >
                  {showYoutubeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="max-results">Max results per query</label>
              <input
                id="max-results"
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="config-input"
                placeholder="50"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="config-actions">
          <button className="btn-save-changes">
            <Copy size={16} />
            Save Changes
          </button>
          <button className="btn-reset">
            <AlertCircle size={16} />
            Reset to Defaults
          </button>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default APIKeys;
