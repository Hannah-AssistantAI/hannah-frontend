/**
 * Monitoring Service
 * Connects to Python backend monitoring endpoints for real-time system metrics.
 */

// API Base URLs from environment (routes through API Gateway in production)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
const PYTHON_API_URL = API_BASE_URL;
const DOTNET_API_URL = API_BASE_URL;

// Helper function to format bytes to human-readable size
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Raw response from backend
interface RawSystemMetrics {
    cpu: number;  // Backend returns just a number
    memory: {
        percent: number;
        used: number;
        total: number;
    };
    disk: {
        percent: number;
        used: number;
        total: number;
    };
    uptime: string;
}

// Types for monitoring data (transformed for frontend use)
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

// Raw MongoDB metrics from backend (matches actual API response)
interface RawMongoDBMetrics {
    connected: boolean;
    activeConnections: number;
    availableConnections: number;
    totalConversations?: number;
    totalQuizQuestions?: number;
    totalLearnTopics?: number;
    dataSize?: number;
    dataSizeFormatted?: string;
    storageSize?: number;
    storageSizeFormatted?: string;
    collections: number;
    error?: string;
}

// Raw Elasticsearch metrics from backend (matches actual API response)
interface RawElasticsearchMetrics {
    connected: boolean;
    status: string;  // 'yellow', 'green', 'red'
    clusterName?: string;
    numberOfNodes?: number;
    activeShards?: number;
    indexedDocuments: number;
    indexSize?: number;
    indexSizeFormatted?: string;
    error?: string;
}

// Raw database response from backend
interface RawDatabaseMetrics {
    mongodb: RawMongoDBMetrics;
    elasticsearch: RawElasticsearchMetrics;
    timestamp?: string;
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
    mongodb: MongoDBMetrics;
    elasticsearch: ElasticsearchMetrics;
    sqlserver?: SqlServerMetrics;
    timestamp: string;
}

// SQL Server metrics from .NET API
export interface SqlServerMetrics {
    connected: boolean;
    status?: string;
    activeConnections?: number;
    maxConnections?: number;
    size?: string;
    avgQueryTime?: number;
    error?: string;
}

export interface ApplicationMetrics {
    totalConversations: number;
    totalLearnTopics: number;
    topicsCreatedToday: number;
    totalQuizzes: number;
    totalFlashcards: number;
    timestamp: string;
}

// Raw Gemini metrics from backend (matches actual API response)
interface RawGeminiMetrics {
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
    avgResponseTime?: number;
    errorRate?: number;
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
    avgResponseTime: number;
    errorRate: number;
}

// API Response wrapper
interface ApiResponse<T> {
    success: boolean;
    data: T;
}

class MonitoringService {
    private baseUrl: string;
    private dotnetUrl: string;

    constructor() {
        this.baseUrl = PYTHON_API_URL;
        this.dotnetUrl = DOTNET_API_URL;
    }

    private async fetchWithTimeout<T>(url: string, timeout = 10000): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const token = localStorage.getItem('access_token');
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
     * Transforms backend response to match frontend expected format
     */
    async getSystemMetrics(): Promise<SystemMetrics> {
        const response = await this.fetchWithTimeout<ApiResponse<RawSystemMetrics>>(
            `${this.baseUrl}/api/v1/monitoring/system`
        );
        const raw = response.data;

        // Transform raw backend data to frontend format
        return {
            cpu: {
                percent: typeof raw.cpu === 'number' ? raw.cpu : 0,
                cores: navigator.hardwareConcurrency || 4, // Use browser API or default
            },
            memory: {
                percent: raw.memory?.percent ?? 0,
                used: raw.memory?.used ?? 0,
                total: raw.memory?.total ?? 0,
                available: (raw.memory?.total ?? 0) - (raw.memory?.used ?? 0),
                usedFormatted: formatBytes(raw.memory?.used ?? 0),
                totalFormatted: formatBytes(raw.memory?.total ?? 0),
            },
            disk: {
                percent: raw.disk?.percent ?? 0,
                used: raw.disk?.used ?? 0,
                total: raw.disk?.total ?? 0,
                free: (raw.disk?.total ?? 0) - (raw.disk?.used ?? 0),
                usedFormatted: formatBytes(raw.disk?.used ?? 0),
                totalFormatted: formatBytes(raw.disk?.total ?? 0),
            },
            uptime: raw.uptime || 'N/A',
            bootTime: '',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get database metrics (MongoDB, Elasticsearch, SQL Server)
     * Transforms backend response to match frontend expected format
     * SQL Server is fetched separately from .NET API with independent error handling
     */
    async getDatabaseMetrics(): Promise<DatabaseMetrics> {
        // Fetch Python metrics (MongoDB, ES) and .NET metrics (SQL Server) in parallel
        // Using Promise.allSettled to prevent one failure from crashing everything
        const [pythonResult, sqlServerResult] = await Promise.allSettled([
            this.fetchWithTimeout<ApiResponse<RawDatabaseMetrics>>(
                `${this.baseUrl}/api/v1/monitoring/database`,
                5000 // 5 second timeout for Python
            ),
            this.getSqlServerMetricsSafe() // Separate safe call for SQL Server
        ]);

        // Process Python metrics (MongoDB, ES)
        let mongodb: MongoDBMetrics = {
            connected: false,
            activeConnections: 0,
            availableConnections: 0,
            storageSizeFormatted: 'N/A',
            error: 'Unable to fetch metrics',
        };
        let elasticsearch: ElasticsearchMetrics = {
            connected: false,
            status: 'unknown',
            indexedDocuments: 0,
            indexSizeFormatted: 'N/A',
            error: 'Unable to fetch metrics',
        };

        if (pythonResult.status === 'fulfilled') {
            const raw = pythonResult.value.data;
            mongodb = {
                connected: raw.mongodb?.connected ?? false,
                activeConnections: raw.mongodb?.activeConnections ?? 0,
                availableConnections: raw.mongodb?.availableConnections ?? 0,
                totalConversations: raw.mongodb?.totalConversations ?? 0,
                storageSizeFormatted: raw.mongodb?.storageSizeFormatted ?? 'N/A',
                collections: raw.mongodb?.collections ?? 0,
                error: raw.mongodb?.error,
            };
            elasticsearch = {
                connected: raw.elasticsearch?.connected ?? false,
                status: raw.elasticsearch?.status ?? 'unknown',
                indexedDocuments: raw.elasticsearch?.indexedDocuments ?? 0,
                indexSizeFormatted: raw.elasticsearch?.indexSizeFormatted ?? 'N/A',
                error: raw.elasticsearch?.error,
            };
        }

        // Process SQL Server metrics (already safe, returns default on error)
        const sqlserver: SqlServerMetrics = sqlServerResult.status === 'fulfilled'
            ? sqlServerResult.value
            : { connected: false, error: 'Unable to fetch metrics' };

        return {
            mongodb,
            elasticsearch,
            sqlserver,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Safely fetch SQL Server metrics from .NET API
     * Returns default values on any error - will NEVER throw or crash
     */
    private async getSqlServerMetricsSafe(): Promise<SqlServerMetrics> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const response = await fetch(`${this.dotnetUrl}/api/monitoring/sqlserver`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return { connected: false, error: `HTTP ${response.status}` };
            }

            const json = await response.json();
            const data = json.data;

            return {
                connected: data?.status === 'healthy',
                status: data?.status ?? 'unknown',
                activeConnections: data?.activeConnections ?? 0,
                maxConnections: data?.maxConnections ?? 0,
                size: data?.size ?? 'N/A',
                avgQueryTime: data?.avgQueryTime ?? 0,
            };
        } catch {
            // Silently return default - no console.error to avoid noise
            return { connected: false, error: 'Service unavailable' };
        }
    }

    /**
     * Get application metrics (requests, conversations)
     */
    async getApplicationMetrics(): Promise<ApplicationMetrics> {
        try {
            const response = await this.fetchWithTimeout<ApiResponse<{
                totalConversations: number;
                totalLearnTopics: number;
                topicsCreatedToday: number;
                totalQuizzes: number;
                totalFlashcards: number;
            }>>(`${this.baseUrl}/api/v1/monitoring/application`);

            const data = response.data;
            return {
                totalConversations: data.totalConversations ?? 0,
                totalLearnTopics: data.totalLearnTopics ?? 0,
                topicsCreatedToday: data.topicsCreatedToday ?? 0,
                totalQuizzes: data.totalQuizzes ?? 0,
                totalFlashcards: data.totalFlashcards ?? 0,
                timestamp: new Date().toISOString(),
            };
        } catch {
            return {
                totalConversations: 0,
                totalLearnTopics: 0,
                topicsCreatedToday: 0,
                totalQuizzes: 0,
                totalFlashcards: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Get Gemini AI usage metrics
     * Transforms backend response to match frontend expected format
     */
    async getGeminiMetrics(): Promise<GeminiMetrics> {
        try {
            const response = await this.fetchWithTimeout<ApiResponse<RawGeminiMetrics>>(
                `${this.baseUrl}/api/v1/monitoring/gemini`
            );
            const raw = response.data;

            // Transform raw backend data to frontend format
            return {
                apiCallsToday: raw?.apiCallsToday ?? 0,
                totalApiCalls: raw?.totalApiCalls ?? 0,
                tokensToday: raw?.tokensToday ?? 0,
                totalTokens: raw?.totalTokens ?? 0,
                conversationsToday: raw?.conversationsToday ?? 0,
                totalConversations: raw?.totalConversations ?? 0,
                model: raw?.model ?? 'gemini-2.0-flash',
                provider: raw?.provider ?? 'Google AI',
                timestamp: raw?.timestamp ?? new Date().toISOString(),
                note: raw?.note ?? 'Metrics from today\'s usage',
                avgResponseTime: raw?.avgResponseTime ?? 0,
                errorRate: raw?.errorRate ?? 0,
            };
        } catch {
            // Return default values on error
            return {
                apiCallsToday: 0,
                totalApiCalls: 0,
                tokensToday: 0,
                totalTokens: 0,
                conversationsToday: 0,
                totalConversations: 0,
                model: 'gemini-2.0-flash',
                provider: 'Google AI',
                timestamp: new Date().toISOString(),
                note: 'Unable to fetch metrics',
                avgResponseTime: 0,
                errorRate: 0,
            };
        }
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
