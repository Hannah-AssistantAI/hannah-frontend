/**
 * Configuration Service
 * Connects to .NET backend Admin API for system configuration management.
 * Provides safe fallback to default values if API is unavailable.
 */

// .NET API Base URL (direct access like other services - see apiConfig.ts)
const DOTNET_API_URL = 'http://localhost:5001/api';

// System Setting from backend
export interface SystemSetting {
    settingId: number;
    settingKey: string;
    settingValue: string;
    settingType: string;
    category?: string;
    description?: string;
    isPublic: boolean;
    updatedBy?: number;
    updatedAt?: string;
}

// API Response wrapper
interface ApiResponse<T> {
    success: boolean;
    data: T;
}

// Default settings to use when API is unavailable
const DEFAULT_SETTINGS: Record<string, string> = {
    // Database
    'database.sqlserver.host': 'localhost',
    'database.sqlserver.max_connections': '100',
    'database.mongodb.uri': 'mongodb://localhost:27017',
    'database.mongodb.pool_size': '50',
    'database.elasticsearch.url': 'http://localhost:9200',
    // Gemini
    'gemini.api_key': '**********************',
    'gemini.model': 'gemini-2.0-flash',
    'gemini.temperature': '0.7',
    'gemini.max_tokens': '2048',
    'gemini.top_p': '0.9',
    'gemini.top_k': '40',
    // Application
    'application.session_timeout': '60',
    'application.daily_question_limit': '100',
    'application.websocket_port': '8000',
    'application.api_rate_limit': '60',
    'application.cache_expiry': '24',
    'application.enable_email_notifications': 'true',
    'application.enable_realtime_monitoring': 'true',
};

class ConfigurationService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = DOTNET_API_URL || 'http://localhost:5000';
    }

    private async fetchWithTimeout<T>(url: string, options?: RequestInit, timeout = 10000): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...options?.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Get all settings, optionally filtered by category
     */
    async getSettings(category?: string): Promise<SystemSetting[]> {
        try {
            const url = category
                ? `${this.baseUrl}/admin/settings?category=${encodeURIComponent(category)}`
                : `${this.baseUrl}/admin/settings`;

            const response = await this.fetchWithTimeout<ApiResponse<SystemSetting[]>>(url);
            return response.data || [];
        } catch (error) {
            console.warn('Failed to fetch settings from API, using defaults:', error);
            // Return empty array - caller should handle with defaults
            return [];
        }
    }

    /**
     * Get a single setting by key
     */
    async getSetting(key: string): Promise<SystemSetting | null> {
        try {
            const response = await this.fetchWithTimeout<ApiResponse<SystemSetting>>(
                `${this.baseUrl}/admin/settings/${encodeURIComponent(key)}`
            );
            return response.data || null;
        } catch (error) {
            console.warn(`Failed to fetch setting '${key}':`, error);
            return null;
        }
    }

    /**
     * Update a setting value
     */
    async updateSetting(key: string, value: string, description?: string): Promise<boolean> {
        try {
            await this.fetchWithTimeout<ApiResponse<unknown>>(
                `${this.baseUrl}/admin/settings/${encodeURIComponent(key)}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        Key: key,
                        SettingValue: value,
                        Description: description,
                    }),
                }
            );
            return true;
        } catch (error) {
            console.error(`Failed to update setting '${key}':`, error);
            return false;
        }
    }

    /**
     * Get settings grouped by category for the Configuration page
     * Returns safe defaults if API is unavailable
     */
    async getConfigurationSettings(): Promise<{
        database: Record<string, string>;
        gemini: Record<string, string>;
        application: Record<string, string>;
    }> {
        const allSettings = await this.getSettings();

        const result = {
            database: {} as Record<string, string>,
            gemini: {} as Record<string, string>,
            application: {} as Record<string, string>,
        };

        // Start with defaults
        Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
            const category = key.split('.')[0] as keyof typeof result;
            if (result[category]) {
                result[category][key] = value;
            }
        });

        // Override with API values if available
        allSettings.forEach((setting) => {
            const category = setting.category?.toLowerCase() as keyof typeof result;
            if (category && result[category]) {
                result[category][setting.settingKey] = setting.settingValue;
            }
        });

        return result;
    }

    /**
     * Get a setting value with safe default fallback
     */
    getDefaultValue(key: string): string {
        return DEFAULT_SETTINGS[key] || '';
    }
}

export const configurationService = new ConfigurationService();
export default configurationService;
