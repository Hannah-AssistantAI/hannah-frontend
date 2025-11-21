/**
 * Python API Client
 * HTTP client specifically for Python backend services (Studio features)
 */

import { getAuthHeaders, HTTP_STATUS, STORAGE_KEYS } from '../config/apiConfig';

// Python API Base URL
export const PYTHON_API_BASE_URL = 'http://localhost:8001';

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
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const url = `${this.baseURL}${endpoint}`;

        const baseHeaders = getAuthHeaders(token || undefined);

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
            if (response.status === HTTP_STATUS.UNAUTHORIZED) {
                this.handleAuthError();
                throw new Error('Unauthorized: Access token expired or invalid.');
            }

            if (!response.ok) {
                const error = await this.handleError(response);
                throw error;
            }

            // Handle responses that might not have a body (e.g., 201, 204)
            if (response.status === HTTP_STATUS.NO_CONTENT || response.status === HTTP_STATUS.CREATED) {
                const contentLength = response.headers.get('content-length');
                if (!contentLength || parseInt(contentLength, 10) === 0) {
                    return {
                        data: null as T,
                        status: response.status,
                    };
                }
            }

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
        } catch (error) {
            console.error('Python API request error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        let url = endpoint;

        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url = `${endpoint}?${queryString}`;
        }

        return this.request<T>(url, {
            method: 'GET',
        });
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
