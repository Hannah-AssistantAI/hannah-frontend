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

// In production: Empty string for relative URLs via nginx proxy
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

class ApiService {
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

  // Dashboard APIs
  async getDashboardStats(): Promise<DashboardStats> {
    return this.fetch<DashboardStats>('/dashboard/stats');
  }

  async getRecentConversations(limit: number = 10): Promise<Conversation[]> {
    return this.fetch<Conversation[]>(`/conversations/recent?limit=${limit}`);
  }

  async getAlerts(): Promise<Alert[]> {
    return this.fetch<Alert[]>('/alerts');
  }

  // System Monitoring APIs
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.fetch<SystemMetrics>('/api/v1/monitoring/system');
  }

  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    return this.fetch<DatabaseMetrics>('/api/v1/monitoring/database');
  }

  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    return this.fetch<ApplicationMetrics>('/api/v1/monitoring/application');
  }

  async getGeminiMetrics(): Promise<GeminiMetrics> {
    return this.fetch<GeminiMetrics>('/api/v1/monitoring/gemini');
  }

  async getResponseSourceDistribution(): Promise<ResponseSourceDistribution> {
    return this.fetch<ResponseSourceDistribution>('/api/v1/monitoring/response-sources');
  }

  // Configuration APIs
  async getConfig(): Promise<ConfigSettings> {
    return this.fetch<ConfigSettings>('/config');
  }

  async updateConfig(section: keyof ConfigSettings, data: any): Promise<void> {
    return this.fetch(`/config/${section}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async testConnection(type: 'database' | 'gemini' | 'integration'): Promise<{ success: boolean; message: string }> {
    return this.fetch(`/config/test/${type}`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
