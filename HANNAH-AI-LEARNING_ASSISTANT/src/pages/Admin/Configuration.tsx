// src/pages/Configuration.tsx
import React, { useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import type { ConfigSettings } from '../../types';
import { Card } from '../../components/Admin/Card';
import { Badge } from 'lucide-react';
import { InfoBox } from '../../components/Admin/InfoBox';
import { Button } from '../../components/Admin/Button';
import AdminPageWrapper from './components/AdminPageWrapper';

export const Configuration: React.FC = () => {
  const { config, loading, saving, updateConfig } = useConfig();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveConfig = async (section: keyof ConfigSettings, formData: any) => {
    const result = await updateConfig(section, formData);

    if (result.success) {
      setSuccessMessage(`Cấu hình ${section} đã được lưu thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage(result.error || 'Không thể lưu cấu hình');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  if (loading || !config) {
    return <div>Đang tải cấu hình...</div>;
  }

  return (
    <AdminPageWrapper title="Cấu hình Hệ thống">
      <InfoBox>
        <strong>Tùy chọn Cấu hình:</strong> Các cài đặt có thể được chỉnh sửa thông qua giao diện quản trị.
        Các thay đổi được lưu vào bảng cấu hình PostgreSQL.
      </InfoBox>

      {successMessage && (
        <div className="alert success" style={{ marginBottom: '24px' }}>
          <div className="alert-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="alert-content">
            <div className="alert-message">{successMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="alert error" style={{ marginBottom: '24px' }}>
          <div className="alert-icon">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="alert-content">
            <div className="alert-message">{errorMessage}</div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {/* Database Configuration */}
        <DatabaseConfigCard
          config={config.database}
          onSave={(data) => handleSaveConfig('database', data)}
          saving={saving}
        />

        {/* Gemini API Configuration */}
        {/* <GeminiConfigCard
          config={config.gemini}
          onSave={(data) => handleSaveConfig('gemini', data)}
          saving={saving}
        /> */}

        {/* Application Settings */}
        <ApplicationConfigCard
          config={config.application}
          onSave={(data) => handleSaveConfig('application', data)}
          saving={saving}
        />

        {/* Integration Settings */}
        {/* <IntegrationConfigCard
          config={config.integrations}
          onSave={(data) => handleSaveConfig('integrations', data)}
          saving={saving}
        /> */}
      </div>

      {/* What Cannot Be Configured */}
      {/* <Card
        title="❌ What CANNOT Be Configured"
        action={<Badge type="danger">Google Internal - No Access</Badge>}
        className="mt-24"
      >
        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
          These aspects are controlled by Google and cannot be modified through this admin panel:
        </p>
        <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)', lineHeight: 2 }}>
          <li>Gemini model architecture and neural network design</li>
          <li>Gemini training data and training process</li>
          <li>Gemini server infrastructure and hardware</li>
          <li>Gemini internal performance (GPU/CPU usage on Google's servers)</li>
          <li>Gemini API rate limits and quotas (set by Google)</li>
          <li>Gemini API pricing structure</li>
        </ul>
        <InfoBox icon="fas fa-info-circle" style={{ marginTop: '16px' }}>
          <strong>Remember:</strong> Hannah uses Gemini as a reasoning engine, but we control 
          the orchestration, knowledge base, caching, and user experience.
        </InfoBox>
      </Card> */}
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
    <Card>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        <i className="fas fa-database" style={{ color: 'var(--success-color)' }}></i> Cấu hình Cơ sở dữ liệu
      </h3>
      <Badge type="success" style={{ marginBottom: '16px' }}>✅ Toàn quyền Kiểm soát</Badge>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Máy chủ PostgreSQL</label>
          <input
            type="text"
            className="form-input"
            value={formData.postgresHost}
            onChange={(e) => setFormData({ ...formData, postgresHost: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Số kết nối tối đa PostgreSQL</label>
          <input
            type="number"
            className="form-input"
            value={formData.postgresMaxConnections}
            onChange={(e) => setFormData({ ...formData, postgresMaxConnections: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">URI MongoDB</label>
          <input
            type="text"
            className="form-input"
            value={formData.mongodbUri}
            onChange={(e) => setFormData({ ...formData, mongodbUri: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Kích thước Pool kết nối MongoDB</label>
          <input
            type="number"
            className="form-input"
            value={formData.mongodbPoolSize}
            onChange={(e) => setFormData({ ...formData, mongodbPoolSize: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">URL Elasticsearch</label>
          <input
            type="text"
            className="form-input"
            value={formData.elasticsearchUrl}
            onChange={(e) => setFormData({ ...formData, elasticsearchUrl: e.target.value })}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          icon="fas fa-save"
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu cấu hình Cơ sở dữ liệu'}
        </Button>
      </form>
    </Card>
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
    <Card>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        <i className="fas fa-robot" style={{ color: 'var(--primary-color)' }}></i> Gemini API Configuration
      </h3>
      <Badge type="warning" style={{ marginBottom: '16px' }}>⚠️ Limited - Parameters Only</Badge>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Gemini API Key</label>
          <input
            type="password"
            className="form-input"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          />
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
            ✅ Can change API key
          </small>
        </div>
        <div className="form-group">
          <label className="form-label">Model Selection</label>
          <select
            className="form-select"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          >
            <option value="gemini-pro">gemini-pro</option>
            <option value="gemini-pro-vision">gemini-pro-vision</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
          </select>
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
            ✅ Can select available models
          </small>
        </div>
        <div className="form-group">
          <label className="form-label">Temperature (0.0 - 1.0)</label>
          <input
            type="number"
            className="form-input"
            value={formData.temperature}
            step="0.1"
            min="0"
            max="1"
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
          />
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
            ✅ Can adjust creativity level
          </small>
        </div>
        <div className="form-group">
          <label className="form-label">Max Output Tokens</label>
          <input
            type="number"
            className="form-input"
            value={formData.maxTokens}
            onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
          />
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
            ✅ Can set response length limit
          </small>
        </div>
        <div className="form-group">
          <label className="form-label">Top P (Nucleus Sampling)</label>
          <input
            type="number"
            className="form-input"
            value={formData.topP}
            step="0.05"
            min="0"
            max="1"
            onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
          />
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
            ✅ Can configure sampling
          </small>
        </div>
        <div className="form-group">
          <label className="form-label">Top K</label>
          <input
            type="number"
            className="form-input"
            value={formData.topK}
            onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) })}
          />
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
            ✅ Can configure token selection
          </small>
        </div>
        <InfoBox icon="fas fa-exclamation-triangle" style={{ marginTop: '16px' }}>
          <strong>Note:</strong> Cannot modify Gemini's internal architecture, training data, 
          or infrastructure. These parameters control how we USE the API.
        </InfoBox>
        <Button
          type="submit"
          variant="primary"
          icon="fas fa-save"
          disabled={saving}
          style={{ marginTop: '16px' }}
        >
          {saving ? 'Saving...' : 'Save Gemini Config'}
        </Button>
      </form>
    </Card>
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
    <Card>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        <i className="fas fa-cog" style={{ color: 'var(--info-color)' }}></i> Cài đặt Ứng dụng
      </h3>
      <Badge type="success" style={{ marginBottom: '16px' }}>✅ Toàn quyền Kiểm soát</Badge>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Thời gian chờ phiên (phút)</label>
          <input
            type="number"
            className="form-input"
            value={formData.sessionTimeout}
            onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Giới hạn câu hỏi hàng ngày mỗi sinh viên</label>
          <input
            type="number"
            className="form-input"
            value={formData.dailyQuestionLimit}
            onChange={(e) => setFormData({ ...formData, dailyQuestionLimit: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Cổng WebSocket</label>
          <input
            type="number"
            className="form-input"
            value={formData.websocketPort}
            onChange={(e) => setFormData({ ...formData, websocketPort: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Giới hạn tốc độ API Backend (yêu cầu/phút)</label>
          <input
            type="number"
            className="form-input"
            value={formData.apiRateLimit}
            onChange={(e) => setFormData({ ...formData, apiRateLimit: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Thời gian hết hạn Cache (giờ)</label>
          <input
            type="number"
            className="form-input"
            value={formData.cacheExpiry}
            onChange={(e) => setFormData({ ...formData, cacheExpiry: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.enableEmailNotifications}
              onChange={(e) => setFormData({ ...formData, enableEmailNotifications: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            <span className="form-label" style={{ margin: 0 }}>Bật thông báo Email</span>
          </label>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.enableRealtimeMonitoring}
              onChange={(e) => setFormData({ ...formData, enableRealtimeMonitoring: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            <span className="form-label" style={{ margin: 0 }}>Bật giám sát thời gian thực</span>
          </label>
        </div>
        <Button
          type="submit"
          variant="primary"
          icon="fas fa-save"
          disabled={saving}
          style={{ marginTop: '16px' }}
        >
          {saving ? 'Đang lưu...' : 'Lưu cấu hình Ứng dụng'}
        </Button>
      </form>
    </Card>
  );
};

// // Integration Configuration Card Component
// const IntegrationConfigCard: React.FC<{
//   config: ConfigSettings['integrations'];
//   onSave: (data: any) => void;
//   saving: boolean;
// }> = ({ config, onSave, saving }) => {
//   const [formData, setFormData] = useState(config);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSave(formData);
//   };

//   return (
//     <Card>
//       <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
//         <i className="fas fa-plug" style={{ color: 'var(--warning-color)' }}></i> Tích hợp Bên ngoài
//       </h3>
//       <Badge type="success" style={{ marginBottom: '16px' }}>✅ Toàn quyền Kiểm soát</Badge>

//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label className="form-label">Khóa API YouTube Data</label>
//           <input
//             type="password"
//             className="form-input"
//             value={formData.youtubeApiKey}
//             onChange={(e) => setFormData({ ...formData, youtubeApiKey: e.target.value })}
//             placeholder="Nhập khóa API YouTube"
//           />
//         </div>
//         <div className="form-group">
//           <label className="form-label">Token API GitHub</label>
//           <input
//             type="password"
//             className="form-input"
//             value={formData.githubApiToken}
//             onChange={(e) => setFormData({ ...formData, githubApiToken: e.target.value })}
//             placeholder="Nhập token GitHub"
//           />
//         </div>
//         <div className="form-group">
//           <label className="form-label">Khóa API Stack Overflow</label>
//           <input
//             type="password"
//             className="form-input"
//             value={formData.stackOverflowApiKey}
//             onChange={(e) => setFormData({ ...formData, stackOverflowApiKey: e.target.value })}
//             placeholder="Nhập khóa Stack Overflow"
//           />
//         </div>
//         <div className="form-group">
//           <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
//             <input
//               type="checkbox"
//               checked={formData.enableAutoFetch}
//               onChange={(e) => setFormData({ ...formData, enableAutoFetch: e.target.checked })}
//               style={{ width: '20px', height: '20px' }}
//             />
//             <span className="form-label" style={{ margin: 0 }}>Bật tự động tải tài nguyên</span>
//           </label>
//         </div>
//         <Button
//           type="submit"
//           variant="primary"
//           icon="fas fa-save"
//           disabled={saving}
//           style={{ marginTop: '16px' }}
//         >
//           {saving ? 'Đang lưu...' : 'Lưu cấu hình Tích hợp'}
//         </Button>
//       </form>
//     </Card>
//   );
// };
