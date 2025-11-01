// src/pages/SystemMonitoring.tsx
import React from 'react';
import {
  useSystemMetrics,
  useDatabaseMetrics,
  useApplicationMetrics,
  useGeminiMetrics,
  useResponseSourceDistribution,
} from '../../../hooks/useMetrics';
import { InfoBox } from '../../../components/Admin/InfoBox';
import { Card } from '../../../components/Admin/Card';
import { MetricRow } from '../../../components/Admin/MetricRow';
import { Badge } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';

export const SystemMonitoring: React.FC = () => {
  const { metrics: systemMetrics, loading: systemLoading } = useSystemMetrics();
  const { metrics: dbMetrics, loading: dbLoading } = useDatabaseMetrics();
  const { metrics: appMetrics, loading: appLoading } = useApplicationMetrics();
  const { metrics: geminiMetrics, loading: geminiLoading } = useGeminiMetrics();
  const { distribution, loading: distLoading } = useResponseSourceDistribution();

  if (systemLoading || dbLoading || appLoading || geminiLoading || distLoading) {
    return <div>Đang tải dữ liệu giám sát...</div>;
  }

  return (
    <AdminPageWrapper title="Giám sát Hệ thống">
      <InfoBox>
        <strong>Nguồn Số liệu:</strong> Tất cả dữ liệu được theo dõi từ backend FastAPI sử dụng psutil,
        kết nối cơ sở dữ liệu và nhật ký ứng dụng.
      </InfoBox>

      {/* Backend System Performance */}
      {systemMetrics && (
        <Card
          title="🖥️ Hiệu suất Hệ thống Backend (Máy chủ FastAPI)"
          action={<Badge type="success">✅ Toàn quyền Truy cập</Badge>}
        >
          <MetricRow
            label="Sử dụng CPU (psutil.cpu_percent)"
            value={`${systemMetrics.cpu}%`}
            progress={{ value: systemMetrics.cpu, max: 100, color: 'primary' }}
          />
          <MetricRow
            label="Sử dụng Bộ nhớ (psutil.virtual_memory)"
            value={`${systemMetrics.memory.percent}% (${(systemMetrics.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(systemMetrics.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB)`}
            progress={{ value: systemMetrics.memory.percent, max: 100, color: 'warning' }}
          />
          <MetricRow
            label="Sử dụng Ổ đĩa (psutil.disk_usage)"
            value={`${systemMetrics.disk.percent}% (${(systemMetrics.disk.used / 1024 / 1024 / 1024).toFixed(0)} GB / ${(systemMetrics.disk.total / 1024 / 1024 / 1024).toFixed(0)} GB)`}
            progress={{ value: systemMetrics.disk.percent, max: 100, color: 'success' }}
          />
          <MetricRow
            label="Thời gian Hoạt động Máy chủ"
            value={systemMetrics.uptime}
          />
        </Card>
      )}

      {/* Database Performance */}
      {dbMetrics && (
        <Card
          title="🗄️ Hiệu suất Cơ sở dữ liệu"
          action={<Badge type="success">✅ Toàn quyền Truy cập</Badge>}
          className="mt-24"
        >
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary-color)' }}>
            PostgreSQL (Dữ liệu có Cấu trúc)
          </h4>
          <MetricRow
            label="Kết nối Đang hoạt động"
            value={`${dbMetrics.postgresql.activeConnections} / ${dbMetrics.postgresql.maxConnections}`}
          />
          <MetricRow
            label="Thời gian Truy vấn Trung bình"
            value={`${dbMetrics.postgresql.avgQueryTime}ms`}
          />
          <MetricRow
            label="Kích thước Cơ sở dữ liệu"
            value={dbMetrics.postgresql.size}
          />

          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: 'var(--success-color)' }}>
            MongoDB (Nhật ký Cuộc trò chuyện)
          </h4>
          <MetricRow
            label="Kết nối Đang hoạt động"
            value={`${dbMetrics.mongodb.activeConnections} / ${dbMetrics.mongodb.maxConnections}`}
          />
          <MetricRow
            label="Tổng số Cuộc trò chuyện"
            value={dbMetrics.mongodb.totalConversations.toLocaleString()}
          />
          <MetricRow
            label="Kích thước Bộ sưu tập"
            value={dbMetrics.mongodb.size}
          />

          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: 'var(--info-color)' }}>
            Elasticsearch (Cơ sở Tri thức)
          </h4>
          <MetricRow
            label="Tài liệu được Lập chỉ mục"
            value={dbMetrics.elasticsearch.indexedDocuments.toLocaleString()}
          />
          <MetricRow
            label="Thời gian Tìm kiếm Trung bình"
            value={`${dbMetrics.elasticsearch.avgSearchTime}ms`}
          />
          <MetricRow
            label="Kích thước Chỉ mục"
            value={dbMetrics.elasticsearch.indexSize}
          />
        </Card>
      )}

      {/* Application Metrics */}
      {appMetrics && (
        <Card
          title="📊 Số liệu Ứng dụng (Theo dõi Backend)"
          action={<Badge type="success">✅ Toàn quyền Truy cập</Badge>}
          className="mt-24"
        >
          <MetricRow
            label="Kết nối WebSocket Đang hoạt động"
            value={appMetrics.activeWebSocketConnections}
          />
          <MetricRow
            label="Yêu cầu/Phút (Hiện tại)"
            value={appMetrics.requestsPerMinute}
          />
          <MetricRow
            label="Yêu cầu Hôm nay"
            value={appMetrics.requestsToday.toLocaleString()}
          />
          <MetricRow
            label="Tỷ lệ Trúng Cache"
            value={`${appMetrics.cacheHitRate}%`}
          />
          <MetricRow
            label="Thời gian Xử lý Backend Trung bình"
            value={`${appMetrics.avgBackendProcessingTime}s`}
          />
        </Card>
      )}

      {/* Gemini API Metrics */}
      {/* {geminiMetrics && (
        <Card
          title="🤖 Gemini API Usage (Tracked from Backend)"
          action={<Badge type="warning">⚠️ Limited - Measured from our side</Badge>}
          className="mt-24"
        >
          <InfoBox>
            These metrics are tracked by our backend when calling Gemini API. 
            We cannot access Gemini's internal infrastructure metrics.
          </InfoBox>
          <MetricRow
            label="API Calls Today"
            value={geminiMetrics.apiCallsToday.toLocaleString()}
          />
          <MetricRow
            label="Total Tokens Used Today"
            value={geminiMetrics.totalTokensUsed.toLocaleString()}
          />
          <MetricRow
            label="Avg Response Time (measured from backend)"
            value={`${geminiMetrics.avgResponseTime}s`}
          />
          <MetricRow
            label="Error Rate"
            value={`${geminiMetrics.errorRate}%`}
          />
          <MetricRow
            label="Slowest Response Today"
            value={`${geminiMetrics.slowestResponse}s`}
          />
          <MetricRow
            label="Fastest Response Today"
            value={`${geminiMetrics.fastestResponse}s`}
          />
        </Card>
      )} */}

      {/* Response Source Distribution */}
      {distribution && (
        <Card
          title="📈 Phân bố Nguồn Phản hồi (Hôm nay)"
          action={<Badge type="success">✅ Được theo dõi trong Ứng dụng</Badge>}
          className="mt-24"
        >
          <MetricRow
            label="Cơ sở Tri thức Cá nhân (Giảng viên)"
            value={`${distribution.personalKB.percentage}% (${distribution.personalKB.count} phản hồi)`}
            progress={{
              value: distribution.personalKB.percentage,
              max: 100,
              color: 'success',
            }}
          />
          <MetricRow
            label="Cơ sở Tri thức Toàn cục"
            value={`${distribution.globalKB.percentage}% (${distribution.globalKB.count} phản hồi)`}
            progress={{
              value: distribution.globalKB.percentage,
              max: 100,
              color: 'primary',
            }}
          />
          <MetricRow
            label="Gemini API (Được tạo)"
            value={`${distribution.geminiAPI.percentage}% (${distribution.geminiAPI.count} phản hồi)`}
            progress={{
              value: distribution.geminiAPI.percentage,
              max: 100,
              color: 'warning',
            }}
          />
        </Card>
      )}
    </AdminPageWrapper>
  );
};
