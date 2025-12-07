// src/pages/SystemMonitoring.tsx
import React, { useEffect, useState } from 'react';
import { InfoBox } from '../../../components/Admin/InfoBox';
import { Card } from '../../../components/Admin/Card';
import { MetricRow } from '../../../components/Admin/MetricRow';
import { ExternalLink, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import { useMonitoringWebSocket, type MonitoringData } from '../../../hooks/useMonitoringWebSocket';

const DOTNET_API_URL = import.meta.env.VITE_DOTNET_API_URL || 'http://localhost:5001';

interface SqlServerMetrics {
  status: string;
  activeConnections: number;
  maxConnections: number;
  size: string;
  avgQueryTime: number;
}

interface HangfireMetrics {
  status: string;
  processing: number;
  succeeded: number;
  failed: number;
  enqueued: number;
  scheduled: number;
  dashboardUrl: string;
}

interface GeminiMetricsData {
  apiCallsToday: number;
  totalTokensUsed: number;
  avgResponseTime: number;
  errorRate: number;
  slowestResponse: number;
  fastestResponse: number;
}

export const SystemMonitoring: React.FC = () => {
  // WebSocket for real-time Python metrics
  const { data: wsData, isConnected, error: wsError, reconnect } = useMonitoringWebSocket();

  // .NET API data (polled)
  const [sqlServerMetrics, setSqlServerMetrics] = useState<SqlServerMetrics | null>(null);
  const [hangfireMetrics, setHangfireMetrics] = useState<HangfireMetrics | null>(null);
  const [geminiMetrics, setGeminiMetrics] = useState<GeminiMetricsData | null>(null);
  const [dotnetLoading, setDotnetLoading] = useState(true);

  // Fetch .NET metrics
  const fetchDotNetMetrics = async () => {
    try {
      const [sqlRes, hangfireRes] = await Promise.all([
        fetch(`${DOTNET_API_URL}/api/monitoring/sqlserver`),
        fetch(`${DOTNET_API_URL}/api/monitoring/hangfire`)
      ]);

      if (sqlRes.ok) {
        const sqlData = await sqlRes.json();
        setSqlServerMetrics(sqlData.data);
      }

      if (hangfireRes.ok) {
        const hfData = await hangfireRes.json();
        setHangfireMetrics(hfData.data);
      }
    } catch (error) {
      console.error('Error fetching .NET metrics:', error);
    } finally {
      setDotnetLoading(false);
    }
  };

  // Fetch Gemini metrics from Python API
  const fetchGeminiMetrics = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/monitoring/gemini`);
      if (res.ok) {
        const data = await res.json();
        setGeminiMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching Gemini metrics:', error);
    }
  };

  useEffect(() => {
    fetchDotNetMetrics();
    fetchGeminiMetrics();

    // Poll .NET metrics every 30 seconds (WebSocket handles Python metrics)
    const interval = setInterval(() => {
      fetchDotNetMetrics();
      fetchGeminiMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Extract metrics from WebSocket data
  const systemMetrics = wsData?.system || null;
  const dbMetrics = wsData?.database || null;
  const infraMetrics = wsData?.infrastructure || null;

  return (
    <AdminPageWrapper title="System Monitoring">
      {/* Connection Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
      }}>
        {isConnected ? (
          <Wifi size={20} color="#22c55e" />
        ) : (
          <WifiOff size={20} color="#ef4444" />
        )}
        <span style={{ flex: 1, color: isConnected ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
          {isConnected ? '🟢 Connected - Real-time updates active' : '🔴 Disconnected'}
        </span>
        {!isConnected && (
          <button
            onClick={reconnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Reconnect
          </button>
        )}
        {wsError && <span style={{ color: '#ef4444', fontSize: '14px' }}>{wsError}</span>}
      </div>

      <InfoBox>
        <strong>Real-time Monitoring:</strong> Data is updated every 5 seconds via WebSocket.
        SQL Server and Hangfire metrics are fetched from .NET API.
      </InfoBox>

      {/* External Dashboards Section */}
      <Card title="🔗 External Dashboards" className="mt-16">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <a
            href="http://localhost:15672"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 107, 0, 0.1)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#ff6b00',
              fontWeight: 500,
              border: '1px solid rgba(255, 107, 0, 0.2)'
            }}
          >
            <ExternalLink size={16} /> RabbitMQ Management
          </a>
          <a
            href={`${DOTNET_API_URL}/hangfire`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#6366f1',
              fontWeight: 500,
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}
          >
            <ExternalLink size={16} /> Hangfire Dashboard
          </a>
          <a
            href="http://localhost:5601"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'rgba(0, 191, 179, 0.1)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#00bfb3',
              fontWeight: 500,
              border: '1px solid rgba(0, 191, 179, 0.2)'
            }}
          >
            <ExternalLink size={16} /> Kibana
          </a>
          <a
            href="http://localhost:9001"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'rgba(201, 0, 22, 0.1)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#c90016',
              fontWeight: 500,
              border: '1px solid rgba(201, 0, 22, 0.2)'
            }}
          >
            <ExternalLink size={16} /> MinIO Console
          </a>
        </div>
      </Card>

      {/* Backend System Performance - Real-time from WebSocket */}
      {!systemMetrics ? (
        <Card title="🖥️ Backend System Performance (FastAPI Server)" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {isConnected ? 'Waiting for data...' : 'Connecting to monitoring service...'}
          </div>
        </Card>
      ) : (
        <Card title="🖥️ Backend System Performance (FastAPI Server)" className="mt-24">
          <MetricRow
            label="CPU Usage"
            value={`${systemMetrics.cpu}%`}
            progress={{ value: systemMetrics.cpu, max: 100, color: systemMetrics.cpu > 80 ? 'danger' : 'primary' }}
          />
          <MetricRow
            label="Memory Usage"
            value={`${systemMetrics.memory.percent}% (${(systemMetrics.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(systemMetrics.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB)`}
            progress={{ value: systemMetrics.memory.percent, max: 100, color: systemMetrics.memory.percent > 80 ? 'danger' : 'warning' }}
          />
          <MetricRow
            label="Disk Usage"
            value={`${systemMetrics.disk.percent}% (${(systemMetrics.disk.used / 1024 / 1024 / 1024).toFixed(0)} GB / ${(systemMetrics.disk.total / 1024 / 1024 / 1024).toFixed(0)} GB)`}
            progress={{ value: systemMetrics.disk.percent, max: 100, color: systemMetrics.disk.percent > 90 ? 'danger' : 'success' }}
          />
          <MetricRow
            label="Server Uptime"
            value={systemMetrics.uptime}
          />
        </Card>
      )}

      {/* Database Performance */}
      <Card title="🗄️ Database Performance" className="mt-24">
        {/* SQL Server - from .NET API */}
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary-color)' }}>
          SQL Server (Structured Data)
          <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '8px', color: '#666' }}>
            via .NET API
          </span>
        </h4>
        {dotnetLoading ? (
          <div style={{ padding: '10px', color: '#666' }}>Loading SQL Server metrics...</div>
        ) : sqlServerMetrics ? (
          <>
            <MetricRow
              label="Active Connections"
              value={`${sqlServerMetrics.activeConnections} / ${sqlServerMetrics.maxConnections}`}
            />
            <MetricRow
              label="Database Size"
              value={sqlServerMetrics.size}
            />
            <MetricRow
              label="Status"
              value={sqlServerMetrics.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}
            />
          </>
        ) : (
          <div style={{ padding: '10px', color: '#ef4444' }}>Failed to load SQL Server metrics</div>
        )}

        {/* MongoDB - from WebSocket */}
        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: 'var(--success-color)' }}>
          MongoDB (Conversation Logs)
          <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '8px', color: '#666' }}>
            real-time
          </span>
        </h4>
        {dbMetrics?.mongodb ? (
          <>
            <MetricRow
              label="Active Connections"
              value={`${dbMetrics.mongodb.activeConnections} / ${dbMetrics.mongodb.maxConnections}`}
            />
            <MetricRow
              label="Total Operations"
              value={dbMetrics.mongodb.totalOperations?.toLocaleString() || 'N/A'}
            />
            <MetricRow
              label="Collection Size"
              value={dbMetrics.mongodb.size}
            />
          </>
        ) : (
          <div style={{ padding: '10px', color: '#666' }}>Waiting for MongoDB metrics...</div>
        )}

        {/* Elasticsearch - from WebSocket */}
        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: 'var(--info-color)' }}>
          Elasticsearch (Knowledge Base)
          <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '8px', color: '#666' }}>
            real-time
          </span>
        </h4>
        {dbMetrics?.elasticsearch ? (
          <>
            <MetricRow
              label="Indexed Documents"
              value={dbMetrics.elasticsearch.indexedDocuments?.toLocaleString() || '0'}
            />
            <MetricRow
              label="Average Search Time"
              value={`${dbMetrics.elasticsearch.avgSearchTime}ms`}
            />
            <MetricRow
              label="Index Size"
              value={dbMetrics.elasticsearch.indexSize}
            />
          </>
        ) : (
          <div style={{ padding: '10px', color: '#666' }}>Waiting for Elasticsearch metrics...</div>
        )}
      </Card>

      {/* Infrastructure Metrics */}
      <Card title="🏗️ Infrastructure" className="mt-24">
        {/* RabbitMQ - from WebSocket */}
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#ff6b00' }}>
          RabbitMQ (Message Queue)
        </h4>
        {infraMetrics?.rabbitmq ? (
          <>
            <MetricRow
              label="Status"
              value={infraMetrics.rabbitmq.status === 'healthy' ? '✅ Connected' : '❌ Disconnected'}
            />
            <MetricRow
              label="Total Messages in Queues"
              value={infraMetrics.rabbitmq.totalMessages}
            />
            <MetricRow
              label="Active Consumers"
              value={infraMetrics.rabbitmq.totalConsumers}
            />
          </>
        ) : (
          <div style={{ padding: '10px', color: '#666' }}>Waiting for RabbitMQ metrics...</div>
        )}

        {/* MinIO - from WebSocket */}
        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: '#c90016' }}>
          MinIO (Object Storage)
        </h4>
        {infraMetrics?.minio ? (
          infraMetrics.minio.status === 'disabled' ? (
            <div style={{ padding: '10px', color: '#666' }}>MinIO is not enabled</div>
          ) : (
            <>
              <MetricRow
                label="Status"
                value={infraMetrics.minio.status === 'healthy' ? '✅ Connected' : '❌ Disconnected'}
              />
              <MetricRow
                label="Total Buckets"
                value={infraMetrics.minio.totalBuckets || 0}
              />
              <MetricRow
                label="Total Objects"
                value={infraMetrics.minio.totalObjects || 0}
              />
              <MetricRow
                label="Total Storage Used"
                value={infraMetrics.minio.totalSize || '0 B'}
              />
            </>
          )
        ) : (
          <div style={{ padding: '10px', color: '#666' }}>Waiting for MinIO metrics...</div>
        )}

        {/* Hangfire - from .NET API */}
        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '24px 0 16px', color: '#6366f1' }}>
          Hangfire (Background Jobs)
        </h4>
        {hangfireMetrics ? (
          <>
            <MetricRow
              label="Status"
              value={hangfireMetrics.status === 'healthy' ? '✅ Running' : '❌ Error'}
            />
            <MetricRow
              label="Processing"
              value={hangfireMetrics.processing}
            />
            <MetricRow
              label="Succeeded (Total)"
              value={hangfireMetrics.succeeded?.toLocaleString() || '0'}
            />
            <MetricRow
              label="Failed (Total)"
              value={hangfireMetrics.failed?.toLocaleString() || '0'}
            />
          </>
        ) : (
          <div style={{ padding: '10px', color: '#666' }}>Loading Hangfire metrics...</div>
        )}
      </Card>

      {/* Gemini AI Metrics */}
      <Card title="🤖 Gemini AI API Usage (Today)" className="mt-24">
        {geminiMetrics ? (
          <>
            <MetricRow
              label="API Calls Today"
              value={geminiMetrics.apiCallsToday?.toLocaleString() || '0'}
            />
            <MetricRow
              label="Total Tokens Used"
              value={geminiMetrics.totalTokensUsed?.toLocaleString() || '0'}
            />
            <MetricRow
              label="Average Response Time"
              value={`${geminiMetrics.avgResponseTime || 0}s`}
            />
            <MetricRow
              label="Error Rate"
              value={`${geminiMetrics.errorRate || 0}%`}
            />
            <MetricRow
              label="Slowest Response"
              value={`${geminiMetrics.slowestResponse || 0}s`}
            />
            <MetricRow
              label="Fastest Response"
              value={`${geminiMetrics.fastestResponse || 0}s`}
            />
          </>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading Gemini metrics...</div>
        )}
      </Card>
    </AdminPageWrapper>
  );
};
