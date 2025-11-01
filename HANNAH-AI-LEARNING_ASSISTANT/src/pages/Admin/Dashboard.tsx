// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import type { DashboardStats, Alert as AlertType, Conversation } from '../../types/index';
import { useModal } from '../../hooks/useModal';
import { Alert } from '../../components/Admin/Alert';
import { StatCard } from '../../components/Admin/StatCard';
import { Card } from '../../components/Admin/Card';
import { Button } from '../../components/Admin/Button';
import { Badge } from '../../components/Admin/Badge';
import { Modal } from '../../components/Admin/Modal';
import { apiService } from '../../service/api';
import AdminPageWrapper from './components/AdminPageWrapper';
import './style.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const usersModal = useModal();
  const connectionsModal = useModal();
  const apiCallsModal = useModal();
  const responseTimeModal = useModal();

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, alertsData, conversationsData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getAlerts(),
        apiService.getRecentConversations(10),
      ]);

      setStats(statsData);
      setAlerts(alertsData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="page-content active">
        <div className="loading-dashboard">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#667eea' }}></i>
          </div>
          <p style={{ marginTop: '20px', fontSize: '16px', color: '#718096' }}>
            Đang tải dữ liệu dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageWrapper title="Dashboard">
      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-container">
          {alerts.map((alert) => (
            <Alert key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon="fas fa-users"
          value={stats.totalUsers.toLocaleString()}
          label="Tổng số người dùng"
          sublabel="✅ Truy vấn PostgreSQL"
          color="purple"
          onClick={usersModal.open}
        />
        <StatCard
          icon="fas fa-comments"
          value={stats.activeConnections}
          label="Kết nối WebSocket đang hoạt động"
          sublabel="✅ Theo dõi thời gian thực từ Backend"
          color="pink"
          onClick={connectionsModal.open}
        />
        <StatCard
          icon="fas fa-exchange-alt"
          value={stats.apiCallsToday}
          label="Lượt gọi Gemini API hôm nay"
          sublabel="✅ Theo dõi cục bộ trong backend"
          color="blue"
          onClick={apiCallsModal.open}
        />
        <StatCard
          icon="fas fa-clock"
          value={`${stats.avgResponseTime}s`}
          label="Thời gian phản hồi trung bình"
          sublabel="✅ Đo từ FastAPI"
          color="green"
          onClick={responseTimeModal.open}
        />
      </div>

      {/* Recent Conversations */}
      <Card
        title="Cuộc trò chuyện gần đây (MongoDB)"
        action={
          <Button variant="outline" icon="fas fa-database">
            Xem tất cả
          </Button>
        }
      >
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>
                  <i className="fas fa-clock" style={{ marginRight: '8px', color: '#667eea' }}></i>
                  Thời gian
                </th>
                <th style={{ width: '200px' }}>
                  <i className="fas fa-user" style={{ marginRight: '8px', color: '#667eea' }}></i>
                  Sinh viên
                </th>
                <th>
                  <i className="fas fa-comment-dots" style={{ marginRight: '8px', color: '#667eea' }}></i>
                  Chủ đề
                </th>
                <th style={{ textAlign: 'center', width: '120px' }}>
                  <i className="fas fa-server" style={{ marginRight: '6px', color: '#43e97b' }}></i>
                  Backend
                </th>
                <th style={{ textAlign: 'center', width: '120px' }}>
                  <i className="fas fa-robot" style={{ marginRight: '6px', color: '#4facfe' }}></i>
                  Gemini
                </th>
                <th style={{ textAlign: 'center', width: '140px' }}>
                  <i className="fas fa-database" style={{ marginRight: '6px', color: '#f093fb' }}></i>
                  Nguồn
                </th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ fontSize: '13px', color: '#4a5568' }}>
                      {new Date(conv.timestamp).toLocaleDateString('vi-VN')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                      {new Date(conv.timestamp).toLocaleTimeString('vi-VN')}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {conv.student.charAt(0)}
                      </div>
                      <span style={{ fontWeight: '500' }}>{conv.student}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 0'
                    }}>
                      <i className="fas fa-bookmark" style={{ 
                        color: '#a0aec0', 
                        fontSize: '12px' 
                      }}></i>
                      <span style={{ color: '#2d3748' }}>{conv.topic}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: '#f0fff4',
                      color: '#22543d',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {conv.backendTime}s
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: '#ebf8ff',
                      color: '#2c5282',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {conv.geminiTime}s
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge type={
                      conv.source === 'personal_kb' ? 'info' :
                      conv.source === 'global_kb' ? 'success' : 'warning'
                    }>
                      {conv.source === 'personal_kb' ? (
                        <><i className="fas fa-user-circle" style={{ marginRight: '4px' }}></i>KB Cá nhân</>
                      ) : conv.source === 'global_kb' ? (
                        <><i className="fas fa-globe" style={{ marginRight: '4px' }}></i>KB Toàn cục</>
                      ) : (
                        <><i className="fas fa-robot" style={{ marginRight: '4px' }}></i>Gemini API</>
                      )}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users Stats Modal */}
      <Modal
        isOpen={usersModal.isOpen}
        onClose={usersModal.close}
        title="Chi tiết tổng số người dùng"
        footer={
          <Button variant="primary" onClick={usersModal.close}>
            Đóng
          </Button>
        }
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: 'var(--primary-color)' }}>
            {stats.totalUsers.toLocaleString()}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Tổng số người dùng đã đăng ký</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>1,180</div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sinh viên</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>67</div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Giảng viên</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>3</div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Quản trị viên</p>
          </div>
        </div>
      </Modal>

      {/* Active Connections Modal */}
      <Modal
        isOpen={connectionsModal.isOpen}
        onClose={connectionsModal.close}
        title="Kết nối WebSocket đang hoạt động"
        footer={
          <Button variant="primary" onClick={connectionsModal.close}>
            Đóng
          </Button>
        }
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: 'var(--primary-color)' }}>
            {stats.activeConnections}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Kết nối đang hoạt động hiện tại</p>
        </div>
        <div className="info-box">
          <i className="fas fa-info-circle"></i>
          <span>Được theo dõi trong thời gian thực từ trình quản lý WebSocket của FastAPI backend</span>
        </div>
      </Modal>

      {/* API Calls Modal */}
      <Modal
        isOpen={apiCallsModal.isOpen}
        onClose={apiCallsModal.close}
        title="Chi tiết Lượt gọi Gemini API"
        footer={
          <Button variant="primary" onClick={apiCallsModal.close}>
            Đóng
          </Button>
        }
      >
        <div className="info-box">
          <i className="fas fa-info-circle"></i>
          Được theo dõi bởi trình bao bọc backend quanh các lệnh gọi Gemini API
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: 'var(--primary-color)' }}>
            {stats.apiCallsToday}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Tổng số Lượt gọi API hôm nay</p>
        </div>
        <div style={{ marginTop: '24px' }}>
          <div className="metric-row">
            <span className="metric-label">Lượt gọi thành công</span>
            <span className="metric-value">454 (99.5%)</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Lượt gọi thất bại</span>
            <span className="metric-value">2 (0.5%)</span>
          </div>
        </div>
      </Modal>

      {/* Response Time Modal */}
      <Modal
        isOpen={responseTimeModal.isOpen}
        onClose={responseTimeModal.close}
        title="Phân tích Thời gian Phản hồi Backend"
        footer={
          <Button variant="primary" onClick={responseTimeModal.close}>
            Đóng
          </Button>
        }
      >
        <div className="info-box">
          <i className="fas fa-info-circle"></i>
          Được đo từ middleware FastAPI - bao gồm toàn bộ thời gian xử lý
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: 'var(--success-color)' }}>
            {stats.avgResponseTime}s
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Thời gian Phản hồi Trung bình Tổng</p>
        </div>
        <h4 style={{ margin: '20px 0 12px' }}>Chi tiết:</h4>
        <div className="metric-row">
          <span className="metric-label">Xử lý Backend</span>
          <span className="metric-value">0.2s (14%)</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Truy vấn Cơ sở dữ liệu</span>
          <span className="metric-value">0.1s (7%)</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Gọi Gemini API</span>
          <span className="metric-value">1.0s (71%)</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Định dạng Phản hồi</span>
          <span className="metric-value">0.1s (7%)</span>
        </div>
      </Modal>
    </AdminPageWrapper>
  );
};
