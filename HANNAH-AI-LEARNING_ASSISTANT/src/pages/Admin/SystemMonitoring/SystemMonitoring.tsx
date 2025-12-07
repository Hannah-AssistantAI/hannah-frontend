// src/pages/SystemMonitoring.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  Server,
  Database,
  Brain,
  Cpu,
  HardDrive,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  Layers,
  FileText
} from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import monitoringService from '../../../service/monitoringService';
import type {
  SystemMetrics,
  DatabaseMetrics,
  ApplicationMetrics,
  GeminiMetrics
} from '../../../service/monitoringService';

// History data point interface
interface HistoryPoint {
  time: string;
  cpu: number;
  memory: number;
}

export const SystemMonitoring: React.FC = () => {
  // Real data states
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics | null>(null);
  const [appMetrics, setAppMetrics] = useState<ApplicationMetrics | null>(null);
  const [geminiMetrics, setGeminiMetrics] = useState<GeminiMetrics | null>(null);

  // History state for chart
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all metrics
  const fetchMetrics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Parallel fetching for speed
      const [sys, db, app, gemini] = await Promise.all([
        monitoringService.getSystemMetrics(),
        monitoringService.getDatabaseMetrics(),
        monitoringService.getApplicationMetrics(),
        monitoringService.getGeminiMetrics()
      ]);

      setSystemMetrics(sys);
      setDbMetrics(db);
      setAppMetrics(app);
      setGeminiMetrics(gemini);
      setLastUpdated(new Date());
      setError(null);

      // Update history
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setHistory(prev => {
        const newPoint = {
          time: timeStr,
          cpu: sys.cpu.percent,
          memory: sys.memory.percent
        };
        // Keep last 20 points (approx 100 seconds at 5s interval)
        const newHistory = [...prev, newPoint];
        return newHistory.slice(-20);
      });

    } catch (err) {
      console.error("Failed to fetch metrics:", err);
      // Don't overwrite data with null on temporary failure, just show error toast or indicator
      // But for initial load, we might need to show error
      if (!systemMetrics) setError(err instanceof Error ? err.message : 'System unavailable');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [systemMetrics]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 5 seconds for "Live" feel
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Reusable Stat Card Component
  const StatCard = ({ title, icon: Icon, color, children, className = '' }: any) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Icon size={18} className={color} />
          {title}
        </h3>
      </div>
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );

  // Simple Row for metrics
  const MetricDataset = ({ label, value, subtext, status }: any) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        {subtext && <div className="text-xs text-slate-400">{subtext}</div>}
      </div>
      <div className="text-right">
        <div className={`font-bold ${status === 'error' ? 'text-red-600' : 'text-slate-800'}`}>
          {value}
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ connected, error }: { connected: boolean; error?: string }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}>
      {connected ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
      {connected ? 'Operational' : 'Error'}
    </span>
  );

  if (isLoading && !systemMetrics) {
    return (
      <AdminPageWrapper title="System Monitoring">
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
          <RefreshCw size={32} className="animate-spin mb-4" />
          <p>Connecting to system telemetry...</p>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="System Monitoring">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-500">Real-time performance metrics and system health status.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={12} />
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchMetrics}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border border-slate-200 hover:bg-white hover:text-blue-600 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
            title="Refresh now"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* LIVE CHART SECTION */}
      {systemMetrics && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-indigo-600" size={20} />
                Live System Performance
              </h2>
              <p className="text-sm text-slate-500">Real-time monitoring of CPU and Memory resources</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-slate-600 font-medium">CPU: {systemMetrics.cpu.percent.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600 font-medium">RAM: {systemMetrics.memory.percent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  name="CPU Usage"
                  animationDuration={500}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMem)"
                  name="Memory Usage"
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Uptime</p>
              <p className="text-slate-800 font-medium mt-1">{systemMetrics.uptime}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Disk Usage</p>
              <p className="text-slate-800 font-medium mt-1">{systemMetrics.disk.percent}% ({systemMetrics.disk.usedFormatted})</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Cores</p>
              <p className="text-slate-800 font-medium mt-1">{systemMetrics.cpu.cores} Physical</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">OS Platform</p>
              <p className="text-slate-800 font-medium mt-1">Linux / Container</p>
            </div>
          </div>
        </div>
      )}

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* DATABASE METRICS */}
        {dbMetrics && (
          <StatCard title="Databases" icon={Database} color="text-blue-500">
            {/* MongoDB */}
            <div className="mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-700 text-sm">MongoDB</h4>
                <StatusBadge connected={dbMetrics.mongodb.connected} />
              </div>
              <MetricDataset label="Connections" value={`${dbMetrics.mongodb.activeConnections}/${dbMetrics.mongodb.availableConnections}`} />
              <MetricDataset label="Conversations" value={dbMetrics.mongodb.totalConversations?.toLocaleString()} />
              <MetricDataset label="Size" value={dbMetrics.mongodb.storageSizeFormatted} />
            </div>

            {/* Elasticsearch */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-700 text-sm">Elasticsearch</h4>
                <StatusBadge connected={dbMetrics.elasticsearch.connected} />
              </div>
              <MetricDataset label="Status" value={dbMetrics.elasticsearch.status} status={dbMetrics.elasticsearch.status === 'green' ? 'success' : 'warning'} />
              <MetricDataset label="Documents" value={dbMetrics.elasticsearch.indexedDocuments?.toLocaleString()} />
            </div>
          </StatCard>
        )}

        {/* APPLICATION METRICS */}
        {appMetrics && (
          <StatCard title="Application Stats" icon={Server} color="text-amber-500">
            <div className="space-y-1">
              <MetricDataset label="Total Conversations" value={appMetrics.totalConversations.toLocaleString()} />
              <MetricDataset label="Flashcards" value={appMetrics.totalFlashcards.toLocaleString()} />
              <MetricDataset label="Quizzes" value={appMetrics.totalQuizzes.toLocaleString()} />
              <MetricDataset
                label="Learn Topics"
                value={appMetrics.totalLearnTopics.toLocaleString()}
                subtext={`+${appMetrics.topicsCreatedToday} today`}
              />
            </div>
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800 italic">
                "Stats reflect active engagement across all learning modules."
              </p>
            </div>
          </StatCard>
        )}

        {/* GEMINI AI METRICS */}
        {geminiMetrics && (
          <StatCard title="Gemini AI Engine" icon={Brain} color="text-purple-500">
            <div className="flex items-center justify-between mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
              <span className="text-sm text-purple-700 font-medium">Model</span>
              <span className="text-xs font-bold bg-white px-2 py-1 rounded text-purple-600 border border-purple-200">
                {geminiMetrics.model}
              </span>
            </div>
            <MetricDataset label="Calls Today" value={geminiMetrics.apiCallsToday.toLocaleString()} />
            <MetricDataset label="Tokens Today" value={geminiMetrics.tokensToday.toLocaleString()} />
            <MetricDataset label="Total Lifetime Calls" value={geminiMetrics.totalApiCalls.toLocaleString()} />

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Zap size={12} />
              <span>{geminiMetrics.note}</span>
            </div>
          </StatCard>
        )}

      </div>
    </AdminPageWrapper>
  );
};
