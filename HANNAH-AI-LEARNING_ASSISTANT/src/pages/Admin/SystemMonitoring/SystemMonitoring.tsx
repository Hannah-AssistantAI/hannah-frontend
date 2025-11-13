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
    return <div>Loading monitoring data...</div>;
  }

  return (
    <AdminPageWrapper title="System Monitoring">
      <InfoBox>
        <strong>Data Sources:</strong> All data is monitored from the FastAPI backend using psutil,
        database connections, and application logs.
      </InfoBox>

      {/* Backend System Performance */}
      {systemMetrics && (
        <Card
          title="🖥️ Backend System Performance (FastAPI Server)"
          action={<Badge type="success">✅ Full Access</Badge>}
        >
          <MetricRow
            label="CPU Usage (psutil.cpu_percent)"
            value={`${systemMetrics.cpu}%`}
            progress={{ value: systemMetrics.cpu, max: 100, color: 'primary' }}
          />
          <MetricRow
            label="Memory Usage (psutil.virtual_memory)"
            value={`${systemMetrics.memory.percent}% (${(systemMetrics.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(systemMetrics.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB)`}
            progress={{ value: systemMetrics.memory.percent, max: 100, color: 'warning' }}
          />
          <MetricRow
            label="Disk Usage (psutil.disk_usage)"
            value={`${systemMetrics.disk.percent}% (${(systemMetrics.disk.used / 1024 / 1024 / 1024).toFixed(0)} GB / ${(systemMetrics.disk.total / 1024 / 1024 / 1024).toFixed(0)} GB)`}
            progress={{ value: systemMetrics.disk.percent, max: 100, color: 'success' }}
          />
          <MetricRow
            label="Server Uptime"
            value={systemMetrics.uptime}
          />
        </Card>
      )}

      {/* Database Performance */}
      {dbMetrics && (
        <Card
          title="🗄️ Database Performance"
          action={<Badge type="success">✅ Full Access</Badge>}
          className="mt-24"
        >
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary-color)' }}>
            PostgreSQL (Structured Data)
          </h4>
          <MetricRow
            label="Active Connections"
            value={`${dbMetrics.postgresql.activeConnections} / ${dbMetrics.postgresql.maxConnections}`}
          />
          <MetricRow
            label="Average Query Time"
            value={`${dbMetrics.postgresql.avgQueryTime}ms`}
          />
          <MetricRow
            label="Database Size"
            value={dbMetrics.postgresql.size}
          />

          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: 'var(--success-color)' }}>
            MongoDB (Conversation Logs)
          </h4>
          <MetricRow
            label="Active Connections"
            value={`${dbMetrics.mongodb.activeConnections} / ${dbMetrics.mongodb.maxConnections}`}
          />
          <MetricRow
            label="Total Conversations"
            value={dbMetrics.mongodb.totalConversations.toLocaleString()}
          />
          <MetricRow
            label="Collection Size"
            value={dbMetrics.mongodb.size}
          />

          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: 'var(--info-color)' }}>
            Elasticsearch (Knowledge Base)
          </h4>
          <MetricRow
            label="Indexed Documents"
            value={dbMetrics.elasticsearch.indexedDocuments.toLocaleString()}
          />
          <MetricRow
            label="Average Search Time"
            value={`${dbMetrics.elasticsearch.avgSearchTime}ms`}
          />
          <MetricRow
            label="Index Size"
            value={dbMetrics.elasticsearch.indexSize}
          />
        </Card>
      )}

      {/* Application Metrics */}
      {appMetrics && (
        <Card
          title="📊 Application Metrics (Backend Monitoring)"
          action={<Badge type="success">✅ Full Access</Badge>}
          className="mt-24"
        >
          <MetricRow
            label="Active WebSocket Connections"
            value={appMetrics.activeWebSocketConnections}
          />
          <MetricRow
            label="Requests/Minute (Current)"
            value={appMetrics.requestsPerMinute}
          />
          <MetricRow
            label="Requests Today"
            value={appMetrics.requestsToday.toLocaleString()}
          />
          <MetricRow
            label="Cache Hit Rate"
            value={`${appMetrics.cacheHitRate}%`}
          />
          <MetricRow
            label="Average Backend Processing Time"
            value={`${appMetrics.avgBackendProcessingTime}s`}
          />
        </Card>
      )}

      {/* Response Source Distribution */}
      {distribution && (
        <Card
          title="📈 Response Source Distribution (Today)"
          action={<Badge type="success">✅ Tracked In-App</Badge>}
          className="mt-24"
        >
          <MetricRow
            label="Personal Knowledge Base (Faculty)"
            value={`${distribution.personalKB.percentage}% (${distribution.personalKB.count} responses)`}
            progress={{
              value: distribution.personalKB.percentage,
              max: 100,
              color: 'success',
            }}
          />
          <MetricRow
            label="Global Knowledge Base"
            value={`${distribution.globalKB.percentage}% (${distribution.globalKB.count} responses)`}
            progress={{
              value: distribution.globalKB.percentage,
              max: 100,
              color: 'primary',
            }}
          />
          <MetricRow
            label="Gemini API (Generated)"
            value={`${distribution.geminiAPI.percentage}% (${distribution.geminiAPI.count} responses)`}
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
