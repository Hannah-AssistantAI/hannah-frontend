import type {
  SystemMetrics,
  DatabaseMetrics,
  ApplicationMetrics,
  GeminiMetrics,
  ResponseSourceDistribution,
  Conversation,
  Alert,
  DashboardStats,
  ConfigSettings,
} from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Mock data for development
const MOCK_DATA = {
  dashboardStats: {
    totalUsers: 1247,
    activeConnections: 32,
    apiCallsToday: 4523,
    avgResponseTime: 1.8,
  } as DashboardStats,

  alerts: [
    {
      id: '1',
      type: 'warning' as const,
      message: 'Phát hiện sử dụng API cao',
      time: '2 phút trước',
      details: 'Lượt gọi Gemini API tăng 45% trong giờ qua',
    },
    {
      id: '2',
      type: 'success' as const,
      message: 'Sao lưu hệ thống hoàn tất',
      time: '1 giờ trước',
      details: 'Sao lưu cơ sở dữ liệu hoàn tất thành công',
    },
    {
      id: '3',
      type: 'info' as const,
      message: 'Sinh viên mới đăng ký',
      time: '3 giờ trước',
      details: '15 sinh viên mới đăng ký hôm nay',
    },
  ] as Alert[],

  conversations: [
    {
      timestamp: '2025-10-23T10:15:30Z',
      student: 'Nguyễn Văn A',
      topic: 'React Hooks',
      backendTime: 0.5,
      geminiTime: 1.2,
      source: 'personal_kb' as const,
    },
    {
      timestamp: '2025-10-23T10:12:15Z',
      student: 'Trần Thị B',
      topic: 'Python Data Structures',
      backendTime: 0.6,
      geminiTime: 1.5,
      source: 'gemini_api' as const,
    },
    {
      timestamp: '2025-10-23T10:08:45Z',
      student: 'Lê Văn C',
      topic: 'Database Normalization',
      backendTime: 0.4,
      geminiTime: 1.0,
      source: 'global_kb' as const,
    },
    {
      timestamp: '2025-10-23T10:05:20Z',
      student: 'Phạm Thị D',
      topic: 'API Design Best Practices',
      backendTime: 0.7,
      geminiTime: 1.8,
      source: 'gemini_api' as const,
    },
    {
      timestamp: '2025-10-23T10:00:10Z',
      student: 'Hoàng Văn E',
      topic: 'CSS Grid Layout',
      backendTime: 0.5,
      geminiTime: 1.3,
      source: 'personal_kb' as const,
    },
  ] as Conversation[],

  systemMetrics: {
    cpu: 45.2,
    memory: {
      used: 6.4,
      total: 16,
      percent: 40,
    },
    disk: {
      used: 120,
      total: 500,
      percent: 24,
    },
    uptime: '15 days 6 hours',
  } as SystemMetrics,

  databaseMetrics: {
    postgresql: {
      activeConnections: 12,
      maxConnections: 100,
      avgQueryTime: 45,
      size: '2.3 GB',
    },
    mongodb: {
      activeConnections: 8,
      maxConnections: 50,
      totalConversations: 15432,
      size: '1.8 GB',
    },
    elasticsearch: {
      indexedDocuments: 23456,
      avgSearchTime: 23,
      indexSize: '890 MB',
    },
  } as DatabaseMetrics,

  applicationMetrics: {
    activeWebSocketConnections: 32,
    requestsPerMinute: 145,
    requestsToday: 8943,
    cacheHitRate: 78.5,
    avgBackendProcessingTime: 0.6,
  } as ApplicationMetrics,

  geminiMetrics: {
    apiCallsToday: 4523,
    totalTokensUsed: 2345678,
    avgResponseTime: 1.4,
    errorRate: 0.5,
    slowestResponse: 4.2,
    fastestResponse: 0.3,
  } as GeminiMetrics,

  responseSourceDistribution: {
    personalKB: {
      percentage: 35,
      count: 1583,
    },
    globalKB: {
      percentage: 28,
      count: 1266,
    },
    geminiAPI: {
      percentage: 37,
      count: 1674,
    },
  } as ResponseSourceDistribution,

  config: {
    database: {
      postgresHost: 'localhost:5432',
      postgresMaxConnections: 100,
      mongodbUri: 'mongodb://localhost:27017',
      mongodbPoolSize: 50,
      elasticsearchUrl: 'http://localhost:9200',
    },
    gemini: {
      apiKey: '*********************',
      model: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.95,
      topK: 40,
    },
    application: {
      sessionTimeout: 30,
      dailyQuestionLimit: 50,
      websocketPort: 8001,
      apiRateLimit: 100,
      cacheExpiry: 3600,
      enableEmailNotifications: true,
      enableRealtimeMonitoring: true,
    },
    integrations: {
      youtubeApiKey: '*********************',
      githubApiToken: '*********************',
      stackOverflowApiKey: '*********************',
      enableAutoFetch: true,
    },
  } as ConfigSettings,
};

class ApiService {
  private useMockData = false; // Real API with auth disabled for monitoring endpoints

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const json = await response.json();
    // Backend wraps response in { success, data }, unwrap it
    return json.data || json;
  }

  private mockDelay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<DashboardStats> {
    if (this.useMockData) {
      await this.mockDelay();
      return MOCK_DATA.dashboardStats;
    }
    return this.fetch<DashboardStats>('/dashboard/stats');
  }

  async getRecentConversations(limit: number = 10): Promise<Conversation[]> {
    if (this.useMockData) {
      await this.mockDelay();
      return MOCK_DATA.conversations.slice(0, limit);
    }
    return this.fetch<Conversation[]>(`/conversations/recent?limit=${limit}`);
  }

  async getAlerts(): Promise<Alert[]> {
    if (this.useMockData) {
      await this.mockDelay();
      return MOCK_DATA.alerts;
    }
    return this.fetch<Alert[]>('/alerts');
  }

  // System Monitoring APIs
  async getSystemMetrics(): Promise<SystemMetrics> {
    if (this.useMockData) {
      await this.mockDelay();
      // Add some randomness to make it look live
      return {
        ...MOCK_DATA.systemMetrics,
        cpu: Math.random() * 20 + 40, // 40-60%
        memory: {
          ...MOCK_DATA.systemMetrics.memory,
          percent: Math.random() * 10 + 35, // 35-45%
        },
      };
    }
    return this.fetch<SystemMetrics>('/api/v1/monitoring/system');
  }

  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    if (this.useMockData) {
      await this.mockDelay();
      return MOCK_DATA.databaseMetrics;
    }
    return this.fetch<DatabaseMetrics>('/api/v1/monitoring/database');
  }

  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    if (this.useMockData) {
      await this.mockDelay();
      return {
        ...MOCK_DATA.applicationMetrics,
        requestsPerMinute: Math.floor(Math.random() * 50 + 120), // 120-170
        cacheHitRate: Math.random() * 10 + 75, // 75-85%
      };
    }
    return this.fetch<ApplicationMetrics>('/api/v1/monitoring/application');
  }

  async getGeminiMetrics(): Promise<GeminiMetrics> {
    if (this.useMockData) {
      await this.mockDelay();
      return MOCK_DATA.geminiMetrics;
    }
    return this.fetch<GeminiMetrics>('/api/v1/monitoring/gemini');
  }

  async getResponseSourceDistribution(): Promise<ResponseSourceDistribution> {
    if (this.useMockData) {
      await this.mockDelay();
      return MOCK_DATA.responseSourceDistribution;
    }
    return this.fetch<ResponseSourceDistribution>('/api/v1/monitoring/response-sources');
  }

  // Configuration APIs
  async getConfig(): Promise<ConfigSettings> {
    if (this.useMockData) {
      await this.mockDelay();
      return MOCK_DATA.config;
    }
    return this.fetch<ConfigSettings>('/config');
  }

  async updateConfig(section: keyof ConfigSettings, data: any): Promise<void> {
    if (this.useMockData) {
      await this.mockDelay();
      console.log(`Mock: Updating config section ${section}`, data);
      // Update mock data
      MOCK_DATA.config[section] = { ...MOCK_DATA.config[section], ...data };
      return;
    }
    return this.fetch(`/config/${section}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async testConnection(type: 'database' | 'gemini' | 'integration'): Promise<{ success: boolean; message: string }> {
    if (this.useMockData) {
      await this.mockDelay(1000);
      return {
        success: Math.random() > 0.2, // 80% success rate
        message: Math.random() > 0.2
          ? `${type} connection successful`
          : `Failed to connect to ${type}`,
      };
    }
    return this.fetch(`/config/test/${type}`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
