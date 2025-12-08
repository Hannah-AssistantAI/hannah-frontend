// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  specialty?: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'locked';
}

export interface SystemMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percent: number;
  };
  disk: {
    used: number;
    total: number;
    percent: number;
  };
  uptime: string;
}

export interface DatabaseMetrics {
  sqlserver: {
    activeConnections: number;
    maxConnections: number;
    avgQueryTime: number;
    size: string;
  };
  mongodb: {
    activeConnections: number;
    maxConnections: number;
    totalConversations: number;
    size: string;
  };
  elasticsearch: {
    indexedDocuments: number;
    avgSearchTime: number;
    indexSize: string;
  };
}

export interface ApplicationMetrics {
  activeWebSocketConnections: number;
  requestsPerMinute: number;
  requestsToday: number;
  cacheHitRate: number;
  avgBackendProcessingTime: number;
}

export interface GeminiMetrics {
  apiCallsToday: number;
  totalTokensUsed: number;
  avgResponseTime: number;
  errorRate: number;
  slowestResponse: number;
  fastestResponse: number;
}

export interface ResponseSourceDistribution {
  personalKB: {
    percentage: number;
    count: number;
  };
  globalKB: {
    percentage: number;
    count: number;
  };
  geminiAPI: {
    percentage: number;
    count: number;
  };
}

export interface Conversation {
  timestamp: string;
  student: string;
  topic: string;
  backendTime: number;
  geminiTime: number;
  source: 'personal_kb' | 'global_kb' | 'gemini_api';
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  time: string;
  details?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeConnections: number;
  apiCallsToday: number;
  avgResponseTime: number;
}

export interface ConfigSettings {
  database: {
    sqlServerHost: string;
    sqlServerMaxConnections: number;
    mongodbUri: string;
    mongodbPoolSize: number;
    elasticsearchUrl: string;
  };
  gemini: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    topK: number;
  };
  application: {
    sessionTimeout: number;
    dailyQuestionLimit: number;
    websocketPort: number;
    apiRateLimit: number;
    cacheExpiry: number;
    enableEmailNotifications: boolean;
    enableRealtimeMonitoring: boolean;
  };
  integrations: {
    youtubeApiKey: string;
    githubApiToken: string;
    stackOverflowApiKey: string;
    enableAutoFetch: boolean;
  };
}

export interface Semester {
  id: number;
  name: string;
}

