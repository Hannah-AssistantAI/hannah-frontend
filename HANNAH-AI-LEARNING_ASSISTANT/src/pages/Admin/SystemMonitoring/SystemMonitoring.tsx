// src/pages/SystemMonitoring.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { InfoBox } from '../../../components/Admin/InfoBox';
import { Card } from '../../../components/Admin/Card';
import { MetricRow } from '../../../components/Admin/MetricRow';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import monitoringService from '../../../service/monitoringService';
import type {
  SystemMetrics,
  DatabaseMetrics,
  ApplicationMetrics,
  GeminiMetrics
} from '../../../service/monitoringService';

export const SystemMonitoring: React.FC = () => {
  // Real data states
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics | null>(null);
  const [appMetrics, setAppMetrics] = useState<ApplicationMetrics | null>(null);
  const [geminiMetrics, setGeminiMetrics] = useState<GeminiMetrics | null>(null);

  // Loading states
  const [systemLoading, setSystemLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  const [geminiLoading, setGeminiLoading] = useState(true);

  // Error states
  const [systemError, setSystemError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all metrics
  const fetchMetrics = useCallback(async () => {
    setIsRefreshing(true);

    // Fetch system metrics
    setSystemLoading(true);
    try {
      const data = await monitoringService.getSystemMetrics();
      setSystemMetrics(data);
      setSystemError(null);
    } catch (err) {
      setSystemError(err instanceof Error ? err.message : 'Failed to load system metrics');
    } finally {
      setSystemLoading(false);
    }

    // Fetch database metrics
    setDbLoading(true);
    try {
      const data = await monitoringService.getDatabaseMetrics();
      setDbMetrics(data);
      setDbError(null);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Failed to load database metrics');
    } finally {
      setDbLoading(false);
    }

    // Fetch application metrics
    setAppLoading(true);
    try {
      const data = await monitoringService.getApplicationMetrics();
      setAppMetrics(data);
      setAppError(null);
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Failed to load application metrics');
    } finally {
      setAppLoading(false);
    }

    // Fetch Gemini metrics
    setGeminiLoading(true);
    try {
      const data = await monitoringService.getGeminiMetrics();
      setGeminiMetrics(data);
      setGeminiError(null);
    } catch (err) {
      setGeminiError(err instanceof Error ? err.message : 'Failed to load Gemini metrics');
    } finally {
      setGeminiLoading(false);
    }

    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const getProgressColor = (percent: number): 'primary' | 'success' | 'warning' | 'danger' => {
    if (percent >= 90) return 'danger';
    if (percent >= 70) return 'warning';
    if (percent >= 50) return 'primary';
    return 'success';
  };

  const StatusBadge = ({ connected, error }: { connected: boolean; error?: string }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: connected ? '#dcfce7' : '#fef2f2',
      color: connected ? '#166534' : '#dc2626'
    }}>
      {connected ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
      {connected ? 'Connected' : (error || 'Disconnected')}
    </span>
  );

  return (
    <AdminPageWrapper title="System Monitoring">
      <InfoBox>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <strong>Live Data:</strong> Metrics are fetched from the Python backend using psutil, MongoDB, and Elasticsearch.
            {lastUpdated && (
              <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </span>
          <button
            onClick={fetchMetrics}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.7 : 1,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </InfoBox>

      {/* Backend System Performance */}
      {systemLoading ? (
        <Card title="🖥️ Backend System Performance (FastAPI Server)">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading system metrics...</div>
        </Card>
      ) : systemError ? (
        <Card title="🖥️ Backend System Performance (FastAPI Server)">
          <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
            <AlertCircle style={{ marginBottom: '8px' }} />
            <p>{systemError}</p>
          </div>
        </Card>
      ) : systemMetrics && (
        <Card
          title="🖥️ Backend System Performance (FastAPI Server)"
          action={<StatusBadge connected={true} />}
        >
          <MetricRow
            label={`CPU Usage (${systemMetrics.cpu.cores} cores)`}
            value={`${systemMetrics.cpu.percent.toFixed(1)}%`}
            progress={{ value: systemMetrics.cpu.percent, max: 100, color: getProgressColor(systemMetrics.cpu.percent) }}
          />
          <MetricRow
            label="Memory Usage"
            value={`${systemMetrics.memory.percent.toFixed(1)}% (${systemMetrics.memory.usedFormatted} / ${systemMetrics.memory.totalFormatted})`}
            progress={{ value: systemMetrics.memory.percent, max: 100, color: getProgressColor(systemMetrics.memory.percent) }}
          />
          <MetricRow
            label="Disk Usage"
            value={`${systemMetrics.disk.percent.toFixed(1)}% (${systemMetrics.disk.usedFormatted} / ${systemMetrics.disk.totalFormatted})`}
            progress={{ value: systemMetrics.disk.percent, max: 100, color: getProgressColor(systemMetrics.disk.percent) }}
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
      ) : dbError ? (
        <Card title="🗄️ Database Performance" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
            <AlertCircle style={{ marginBottom: '8px' }} />
            <p>{dbError}</p>
          </div>
        </Card>
      ) : dbMetrics && (
        <Card
          title="🗄️ Database Performance"
          className="mt-24"
        >
          {/* MongoDB Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#16a34a', margin: 0 }}>
                MongoDB (Conversations & Messages)
              </h4>
              <StatusBadge connected={dbMetrics.mongodb?.connected || false} error={dbMetrics.mongodb?.error} />
            </div>
            {dbMetrics.mongodb?.connected ? (
              <>
                <MetricRow
                  label="Active Connections"
                  value={`${dbMetrics.mongodb.activeConnections} / ${dbMetrics.mongodb.availableConnections}`}
                />
                <MetricRow
                  label="Total Conversations"
                  value={dbMetrics.mongodb.totalConversations?.toLocaleString() || '0'}
                />
                <MetricRow
                  label="Learn Topics"
                  value={dbMetrics.mongodb.totalLearnTopics?.toLocaleString() || '0'}
                />
                <MetricRow
                  label="Quiz Questions"
                  value={dbMetrics.mongodb.totalQuizQuestions?.toLocaleString() || '0'}
                />
                <MetricRow
                  label="Database Size"
                  value={dbMetrics.mongodb.storageSizeFormatted || 'N/A'}
                />
              </>
            ) : (
              <p style={{ color: '#dc2626', padding: '12px', background: '#fef2f2', borderRadius: '6px' }}>
                {dbMetrics.mongodb?.error || 'Unable to connect to MongoDB'}
              </p>
            )}
          </div>

          {/* Elasticsearch Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2563eb', margin: 0 }}>
                Elasticsearch (Knowledge Base)
              </h4>
              <StatusBadge connected={dbMetrics.elasticsearch?.connected || false} error={dbMetrics.elasticsearch?.error} />
            </div>
            {dbMetrics.elasticsearch?.connected ? (
              <>
                <MetricRow
                  label="Cluster Status"
                  value={dbMetrics.elasticsearch.status || 'unknown'}
                />
                <MetricRow
                  label="Indexed Documents"
                  value={dbMetrics.elasticsearch.indexedDocuments?.toLocaleString() || '0'}
                />
                <MetricRow
                  label="Index Size"
                  value={dbMetrics.elasticsearch.indexSizeFormatted || 'N/A'}
                />
                <MetricRow
                  label="Active Shards"
                  value={dbMetrics.elasticsearch.activeShards?.toString() || '0'}
                />
              </>
            ) : (
              <p style={{ color: '#dc2626', padding: '12px', background: '#fef2f2', borderRadius: '6px' }}>
                {dbMetrics.elasticsearch?.error || 'Unable to connect to Elasticsearch'}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Application Metrics */}
      {appLoading ? (
        <Card title="📊 Application Metrics" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading application metrics...</div>
        </Card>
      ) : appError ? (
        <Card title="📊 Application Metrics" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
            <AlertCircle style={{ marginBottom: '8px' }} />
            <p>{appError}</p>
          </div>
        </Card>
      ) : appMetrics && (
        <Card
          title="📊 Application Metrics"
          action={<StatusBadge connected={true} />}
          className="mt-24"
        >
          <MetricRow
            label="Total Conversations"
            value={appMetrics.totalConversations.toLocaleString()}
          />
          <MetricRow
            label="Learn Topics"
            value={appMetrics.totalLearnTopics.toLocaleString()}
          />
          <MetricRow
            label="Topics Created Today"
            value={appMetrics.topicsCreatedToday.toLocaleString()}
          />
          <MetricRow
            label="Total Quizzes"
            value={appMetrics.totalQuizzes.toLocaleString()}
          />
          <MetricRow
            label="Total Flashcards"
            value={appMetrics.totalFlashcards.toLocaleString()}
          />
        </Card>
      )}

      {/* Gemini AI Metrics */}
      {geminiLoading ? (
        <Card title="🤖 Gemini AI Usage" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading Gemini metrics...</div>
        </Card>
      ) : geminiError ? (
        <Card title="🤖 Gemini AI Usage" className="mt-24">
          <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
            <AlertCircle style={{ marginBottom: '8px' }} />
            <p>{geminiError}</p>
          </div>
        </Card>
      ) : geminiMetrics && (
        <Card
          title="🤖 Gemini AI Usage"
          action={<StatusBadge connected={true} />}
          className="mt-24"
        >
          <MetricRow
            label="AI Responses Today"
            value={geminiMetrics.apiCallsToday.toLocaleString()}
          />
          <MetricRow
            label="Total AI Responses"
            value={geminiMetrics.totalApiCalls.toLocaleString()}
          />
          <MetricRow
            label="Tokens Today"
            value={geminiMetrics.tokensToday.toLocaleString()}
          />
          <MetricRow
            label="Total Tokens"
            value={geminiMetrics.totalTokens.toLocaleString()}
          />
          <MetricRow
            label="Conversations Today"
            value={geminiMetrics.conversationsToday.toLocaleString()}
          />
          <MetricRow
            label="Model"
            value={geminiMetrics.model}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', fontStyle: 'italic' }}>
            {geminiMetrics.note}
          </p>
        </Card>
      )}
    </AdminPageWrapper>
  );
};
