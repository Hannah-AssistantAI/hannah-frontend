// src/pages/SystemMonitoring.tsx
import React from 'react';

import { InfoBox } from '../../../components/Admin/InfoBox';
import { Card } from '../../../components/Admin/Card';
import { MetricRow } from '../../../components/Admin/MetricRow';
import { Badge } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';

export const SystemMonitoring: React.FC = () => {
  // MOCK DATA IMPLEMENTATION
  const systemMetrics = {
    cpu: 45,
    memory: { percent: 60, used: 8589934592, total: 17179869184 },
    disk: { percent: 75, used: 322122547200, total: 536870912000 },
    uptime: '5d 12h 30m'
  };
  const systemLoading = false;

  const dbMetrics = {
    sqlserver: {
      activeConnections: 25,
      maxConnections: 100,
      avgQueryTime: 12,
      size: '2.5 GB'
    },
    mongodb: {
      activeConnections: 15,
      maxConnections: 50,
      totalConversations: 1250,
      size: '1.2 GB'
    },
    elasticsearch: {
      indexedDocuments: 5000,
      avgSearchTime: 45,
      indexSize: '850 MB'
    }
  };
  const dbLoading = false;

  const appMetrics = {
    activeWebSocketConnections: 120,
    requestsPerMinute: 350,
    requestsToday: 15400,
    cacheHitRate: 85,
    avgBackendProcessingTime: 0.25
  };
  const appLoading = false;

  const geminiMetrics = {
    apiCallsToday: 2500,
    totalTokensUsed: 1500000,
    avgResponseTime: 1.5,
    errorRate: 0.5,
    slowestResponse: 4.2,
    fastestResponse: 0.3
  };
  const geminiLoading = false;

  const distribution = {
    personalKB: { percentage: 40, count: 1000 },
    globalKB: { percentage: 35, count: 875 },
    geminiAPI: { percentage: 25, count: 625 }
  };
  const distLoading = false;

  return (
    <AdminPageWrapper title="System Monitoring">
      <InfoBox>
        <strong>Data Sources:</strong> All data is monitored from the FastAPI backend using psutil,
        database connections, and application logs.
      </InfoBox>

      {/* Backend System Performance */}
      {systemLoading ? (
        <Card title="🖥️ Backend System Performance (FastAPI Server)">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading system metrics...</div>
        </Card>
      ) : systemMetrics && (
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
      {dbLoading ? (
        <Card title="🗄️ Database Performance" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading database metrics...</div>
        </Card>
      ) : dbMetrics && (
        <Card
          title="🗄️ Database Performance"
          action={<Badge type="success">✅ Full Access</Badge>}
          className="mt-24"
        >
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary-color)' }}>
            SQL Server (Structured Data)
          </h4>
          <MetricRow
            label="Active Connections"
            value={`${dbMetrics.sqlserver.activeConnections} / ${dbMetrics.sqlserver.maxConnections}`}
          />
          <MetricRow
            label="Average Query Time"
            value={`${dbMetrics.sqlserver.avgQueryTime}ms`}
          />
          <MetricRow
            label="Database Size"
            value={dbMetrics.sqlserver.size}
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
      {appLoading ? (
        <Card title="📊 Application Metrics (Backend Monitoring)" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading application metrics...</div>
        </Card>
      ) : appMetrics && (
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

      {/* Gemini AI Metrics */}
      {geminiLoading ? (
        <Card title="🤖 Gemini AI API Usage (Today)" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading Gemini metrics...</div>
        </Card>
      ) : geminiMetrics && (
        <Card
          title="🤖 Gemini AI API Usage (Today)"
          action={<Badge type="success">✅ Full Access</Badge>}
          className="mt-24"
        >
          <MetricRow
            label="API Calls Today"
            value={geminiMetrics.apiCallsToday.toLocaleString()}
          />
          <MetricRow
            label="Total Tokens Used"
            value={geminiMetrics.totalTokensUsed.toLocaleString()}
          />
          <MetricRow
            label="Average Response Time"
            value={`${geminiMetrics.avgResponseTime}s`}
          />
          <MetricRow
            label="Error Rate"
            value={`${geminiMetrics.errorRate}%`}
          />
          <MetricRow
            label="Slowest Response"
            value={`${geminiMetrics.slowestResponse}s`}
          />
          <MetricRow
            label="Fastest Response"
            value={`${geminiMetrics.fastestResponse}s`}
          />
        </Card>
      )}

      {/* Response Source Distribution */}
      {distLoading ? (
        <Card title="📈 Response Source Distribution (All Time)" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading response distribution...</div>
        </Card>
      ) : distribution && (
        <Card
          title="📈 Response Source Distribution (All Time)"
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
