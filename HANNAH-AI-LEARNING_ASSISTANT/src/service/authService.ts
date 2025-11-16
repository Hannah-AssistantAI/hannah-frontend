/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import {
  API_ENDPOINTS,
  buildApiUrl,
  getAuthHeaders,
  STORAGE_KEYS,
  HTTP_STATUS,
} from '../config/apiConfig';

// Type definitions for Auth API
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Authentication Service Class
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<any> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();

      // Save tokens to localStorage
      this.saveTokens(result.accessToken, result.refreshToken);
      this.saveUserData(result.user);

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();

      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
        method: 'POST',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        console.warn('Logout request failed, but clearing local data anyway');
      }

      // Clear local storage
      this.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even if API call fails
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<LoginResponse> {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const result = await response.json();

      // Update tokens
      this.saveTokens(result.accessToken, result.refreshToken);

      return result;
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(tokenOverride?: string): Promise<UserData> {
    try {
      const token = tokenOverride || this.getAccessToken();

      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.ME), {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        // This could be a place to try refreshing the token
        console.warn('Access token expired or invalid.');
        this.clearTokens(); // Clear invalid tokens
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to get user info, status:', response.status, 'body:', errorBody);
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      const userData = await response.json();
      this.saveUserData(userData); // Keep user data in sync

      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      // Don't re-throw 'No access token available' to avoid unhandled promise rejections in some cases
      if ((error as Error).message === 'No access token available') {
        // Silently fail or handle as needed, for now, just log
      } else {
        throw error;
      }
      // Return a rejected promise to be caught by callers
      return Promise.reject(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const token = this.getAccessToken();

      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password change failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Token management methods
  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  saveUserData(userData: UserData): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  getUserData(): UserData | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;

