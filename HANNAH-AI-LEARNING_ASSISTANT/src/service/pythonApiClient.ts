/**
 * Python API Client
 * HTTP client specifically for Python backend services (Studio features)
 */

import { getAuthHeaders, HTTP_STATUS, STORAGE_KEYS } from '../config/apiConfig';

// Python API Base URL
// In production: Routes through nginx proxy (empty string for relative URLs)
// In local dev: Set VITE_PYTHON_API_URL=http://localhost:8001
export const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL
    ?? import.meta.env.VITE_API_BASE_URL
    ?? '';

export interface ApiResponse<T = any> {
    data: T;
    status: number;
    message?: string;
}

export interface ApiError {
    message: string;
    status: number;
    errors?: Record<string, string[]>;
}

class PythonApiClient {
    private baseURL: string;

    constructor(baseURL: string = PYTHON_API_BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Generic request method
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        requireAuth: boolean = true
    ): Promise<ApiResponse<T>> {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const url = `${this.baseURL}${endpoint}`;

        const baseHeaders: Record<string, string> = requireAuth ? getAuthHeaders(token || undefined) : {};

        // Only add Content-Type for non-GET requests when auth is not required
        // GET requests shouldn't have Content-Type, avoiding unnecessary CORS preflight
        if (!requireAuth && options.method && options.method !== 'GET') {
            baseHeaders['Content-Type'] = 'application/json';
        }

        // When the body is FormData, we must not set the 'Content-Type' header.
        // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
        if (options.body instanceof FormData) {
            delete baseHeaders['Content-Type'];
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...baseHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // Handle different response statuses
            if (response.status === HTTP_STATUS.UNAUTHORIZED && requireAuth) {
                this.handleAuthError();
                throw new Error('Unauthorized: Access token expired or invalid.');
            }

            if (!response.ok) {
                const error = await this.handleError(response);
                throw error;
            }

            // Handle 204 No Content - genuinely has no body
            if (response.status === HTTP_STATUS.NO_CONTENT) {
                return {
                    data: null as T,
                    status: response.status,
                };
            }

            // For 201 Created - always try to parse body (server may send data)

            const data = await response.json();

            console.log('=== PYTHON API CLIENT ===');
            console.log('Endpoint:', url);
            console.log('Status:', response.status);
            console.log('Raw data:', data);
            console.log('=========================');

            return {
                data,
                status: response.status,
                message: data.message,
            };
        } catch (error: any) {
            console.error('Python API request error:', error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang chạy.');
            }
            throw error;
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, params?: Record<string, any>, requireAuth: boolean = true): Promise<ApiResponse<T>> {
        let url = endpoint;

        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url = `${endpoint}?${queryString}`;
        }

        return this.request<T>(url, {
            method: 'GET',
        }, requireAuth);
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
        });
    }

    /**
     * Handle authentication errors
     */
    private handleAuthError(): void {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        window.location.href = '/';
    }

    /**
     * Handle API errors
     */
    private async handleError(response: Response): Promise<ApiError> {
        let errorMessage = 'An error occurred';
        let errors: Record<string, string[]> | undefined;

        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.detail || errorData.title || errorMessage;
            errors = errorData.errors;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }

        return {
            message: errorMessage,
            status: response.status,
            errors,
        };
    }
}

// Export singleton instance
export const pythonApiClient = new PythonApiClient();
export default pythonApiClient;
