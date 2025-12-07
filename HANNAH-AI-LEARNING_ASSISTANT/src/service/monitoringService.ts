/**
 * Monitoring Service
 * Connects to Python backend monitoring endpoints for real-time system metrics.
 */

// Python API Base URL (same as pythonApiClient.ts)
const PYTHON_API_URL = 'http://localhost:8001';

// Types for monitoring data
export interface SystemMetrics {
    cpu: {
        percent: number;
        cores: number;
    };
    memory: {
        percent: number;
        used: number;
        total: number;
        available: number;
        usedFormatted: string;
        totalFormatted: string;
    };
    disk: {
        percent: number;
        used: number;
        total: number;
        free: number;
        usedFormatted: string;
        totalFormatted: string;
    };
    uptime: string;
    bootTime: string;
    timestamp: string;
}

export interface MongoDBMetrics {
    connected: boolean;
    activeConnections?: number;
    availableConnections?: number;
    totalConversations?: number;
    totalQuizQuestions?: number;
    totalLearnTopics?: number;
    dataSize?: number;
    dataSizeFormatted?: string;
    storageSize?: number;
    storageSizeFormatted?: string;
    collections?: number;
    error?: string;
}

export interface ElasticsearchMetrics {
    connected: boolean;
    status?: string;
    clusterName?: string;
    numberOfNodes?: number;
    activeShards?: number;
    indexedDocuments?: number;
    indexSize?: number;
    indexSizeFormatted?: string;
    error?: string;
}

export interface DatabaseMetrics {
    mongodb: MongoDBMetrics | null;
    elasticsearch: ElasticsearchMetrics | null;
    timestamp: string;
}

export interface ApplicationMetrics {
    totalConversations: number;
    totalLearnTopics: number;
    topicsCreatedToday: number;
    totalQuizzes: number;
    totalFlashcards: number;
    timestamp: string;
}

export interface GeminiMetrics {
    apiCallsToday: number;
    totalApiCalls: number;
    tokensToday: number;
    totalTokens: number;
    conversationsToday: number;
    totalConversations: number;
    model: string;
    provider: string;
    timestamp: string;
    note: string;
}

// API Response wrapper
interface ApiResponse<T> {
    success: boolean;
    data: T;
}

class MonitoringService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = PYTHON_API_URL || 'http://localhost:8001';
    }

    private async fetchWithTimeout<T>(url: string, timeout = 10000): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
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
     * Get system metrics (CPU, Memory, Disk, Uptime)
     */
    async getSystemMetrics(): Promise<SystemMetrics> {
        const response = await this.fetchWithTimeout<ApiResponse<SystemMetrics>>(
            `${this.baseUrl}/api/v1/monitoring/system`
        );
        return response.data;
    }

    /**
     * Get database metrics (MongoDB, Elasticsearch)
     */
    async getDatabaseMetrics(): Promise<DatabaseMetrics> {
        const response = await this.fetchWithTimeout<ApiResponse<DatabaseMetrics>>(
            `${this.baseUrl}/api/v1/monitoring/databases`
        );
        return response.data;
    }

    /**
     * Get application metrics (requests, conversations)
     */
    async getApplicationMetrics(): Promise<ApplicationMetrics> {
        const response = await this.fetchWithTimeout<ApiResponse<ApplicationMetrics>>(
            `${this.baseUrl}/api/v1/monitoring/application`
        );
        return response.data;
    }

    /**
     * Get Gemini AI usage metrics
     */
    async getGeminiMetrics(): Promise<GeminiMetrics> {
        const response = await this.fetchWithTimeout<ApiResponse<GeminiMetrics>>(
            `${this.baseUrl}/api/v1/monitoring/gemini`
        );
        return response.data;
    }

    /**
     * Get all monitoring metrics at once
     */
    async getAllMetrics(): Promise<{
        system: SystemMetrics | null;
        databases: DatabaseMetrics | null;
        application: ApplicationMetrics | null;
        gemini: GeminiMetrics | null;
    }> {
        const [system, databases, application, gemini] = await Promise.allSettled([
            this.getSystemMetrics(),
            this.getDatabaseMetrics(),
            this.getApplicationMetrics(),
            this.getGeminiMetrics(),
        ]);

        return {
            system: system.status === 'fulfilled' ? system.value : null,
            databases: databases.status === 'fulfilled' ? databases.value : null,
            application: application.status === 'fulfilled' ? application.value : null,
            gemini: gemini.status === 'fulfilled' ? gemini.value : null,
        };
    }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
