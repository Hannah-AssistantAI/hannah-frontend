/**
 * API Client
 * Generic HTTP client with interceptors and error handling
 */

import { API_BASE_URL, getAuthHeaders, HTTP_STATUS, STORAGE_KEYS } from '../config/apiConfig';

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

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
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
      if (response.status === HTTP_STATUS.UNAUTHORIZED && !isRetry) {
        // Try to refresh token (only if this is not already a retry)
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          // Retry the original request with the new token
          return this.request<T>(endpoint, options, true);
        } else {
          // Redirect to login
          this.handleAuthError();
          throw new Error('Unauthorized');
        }
      }

      if (!response.ok) {
        const error = await this.handleError(response);
        throw error;
      }

      // Handle no content response
      if (response.status === HTTP_STATUS.NO_CONTENT) {
        return {
          data: null as T,
          status: response.status,
        };
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        message: data.message,
      };
    } catch (error) {
      console.error('API request error:', error);
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
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * POST request for FormData
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    // For FormData, we don't stringify the body and we let the browser set the Content-Type header
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
    return response;
  }

  /**
   * GET request for Blob responses (file downloads)
   */
  async getBlob(endpoint: string): Promise<Blob> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      method: 'GET',
      headers: getAuthHeaders(token || undefined),
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw await this.handleError(response);
    }

    return response.blob();
  }

  /**
   * Handle token refresh
   */
  private async handleTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        console.error('No refresh token found in storage.');
        return false;
      }

      const response = await fetch(`${this.baseURL}/api/Auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }), // Explicitly match the API spec
      });

      if (!response.ok) {
        console.error(`Token refresh API call failed with status: ${response.status}`);
        return false;
      }

      const data = await response.json();

      if (!data.accessToken || !data.refreshToken) {
        console.error('Token refresh response is missing tokens.');
        return false;
      }

      // Save new tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);

      return true;
    } catch (error) {
      console.error('An exception occurred during token refresh:', error);
      return false;
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    // Clear tokens
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);

    // Redirect to login page
    window.location.href = '/'; // Redirect to home page
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<ApiError> {
    let errorMessage = 'An error occurred';
    let errors: Record<string, string[]> | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.title || errorMessage;
      errors = errorData.errors;
    } catch {
      // If response is not JSON, use status text
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
export const apiClient = new ApiClient();
export default apiClient;

