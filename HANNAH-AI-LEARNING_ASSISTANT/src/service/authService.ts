/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient from './apiClient';
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
  userId: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  // Profile fields from login response
  phone?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  studentId?: string | null;
  studentSpecialty?: string | null;
  notificationPreferences?: string | null;
  updatedAt?: string | null;
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

      // Save tokens to localStorage first
      this.saveTokens(result.accessToken, result.refreshToken);

      // Fetch full profile data after login
      try {
        const profileResponse = await fetch(
          buildApiUrl(`/api/Users/${result.user.userId}/profile`),
          {
            method: 'GET',
            headers: {
              ...getAuthHeaders(),
              'Authorization': `Bearer ${result.accessToken}`,
            },
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // Merge login user data with profile data
          const fullUserData = {
            ...result.user,
            phone: profileData.phone,
            dateOfBirth: profileData.dateOfBirth,
            bio: profileData.bio,
            studentId: profileData.studentId,
            studentSpecialty: profileData.studentSpecialty,
            notificationPreferences: profileData.notificationPreferences,
            updatedAt: profileData.updatedAt,
          };

          // Save the merged user data
          this.saveUserData(fullUserData);

          // Return the result with full user data
          return {
            ...result,
            user: fullUserData,
          };
        }
      } catch (profileError) {
        console.warn('Failed to fetch profile data, using basic user data:', profileError);
      }

      // Fallback: save basic user data if profile fetch fails
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

      // Use apiClient which has automatic token refresh logic
      const response = await apiClient.get<UserData>(API_ENDPOINTS.AUTH.ME);
      const userData = response.data;

      this.saveUserData(userData); // Keep user data in sync
      return userData;

    } catch (error) {
      console.error('Get current user error:', error);
      // Re-throw the error to be handled by the caller (e.g., AuthContext)
      throw error;
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
const authService = new AuthService();
export default authService;

