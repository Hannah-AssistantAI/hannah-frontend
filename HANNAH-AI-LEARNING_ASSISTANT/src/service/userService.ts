/**
 * User Service
 * Handles all user-related API calls
 */

import apiClient from './apiClient';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders, STORAGE_KEYS } from '../config/apiConfig';

// Type definitions for User API
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

export interface UpdateProfileRequest {
  bio?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  language: string;
  theme: string;
  notifications: boolean;
  emailNotifications: boolean;
}

export interface UpdatePreferencesRequest {
  language?: string;
  theme?: string;
  notifications?: boolean;
  emailNotifications?: boolean;
}

export interface UserQuiz {
  id: string;
  title: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

/**
 * User Service Class
 */
class UserService {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(API_ENDPOINTS.USER.GET_ALL);
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post<User>(API_ENDPOINTS.USER.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(API_ENDPOINTS.USER.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put<User>(API_ENDPOINTS.USER.UPDATE(id), data);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.USER.DELETE(id));
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>(API_ENDPOINTS.USER.GET_PROFILE(userId));
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await apiClient.put<UserProfile>(
        API_ENDPOINTS.USER.UPDATE_PROFILE(userId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await apiClient.get<UserPreferences>(
        API_ENDPOINTS.USER.GET_PREFERENCES(userId)
      );
      return response.data;
    } catch (error) {
      console.error('Get user preferences error:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    data: UpdatePreferencesRequest
  ): Promise<UserPreferences> {
    try {
      const response = await apiClient.put<UserPreferences>(
        API_ENDPOINTS.USER.UPDATE_PREFERENCES(userId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Update user preferences error:', error);
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<void> {
    try {
      await apiClient.put(API_ENDPOINTS.USER.ACTIVATE(userId));
    } catch (error) {
      console.error('Activate user error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      await apiClient.put(API_ENDPOINTS.USER.DEACTIVATE(userId));
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw error;
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.UPLOAD_AVATAR(userId)), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData, browser will set it automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Avatar upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.USER.DELETE_AVATAR(userId));
    } catch (error) {
      console.error('Delete avatar error:', error);
      throw error;
    }
  }

  /**
   * Get user quizzes
   */
  async getUserQuizzes(userId: string): Promise<UserQuiz[]> {
    try {
      const response = await apiClient.get<UserQuiz[]>(API_ENDPOINTS.USER.GET_QUIZZES(userId));
      return response.data;
    } catch (error) {
      console.error('Get user quizzes error:', error);
      throw error;
    }
  }

  /**
   * Get import faculty template
   */
  async getImportTemplate(): Promise<Blob> {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.GET_IMPORT_TEMPLATE), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      return await response.blob();
    } catch (error) {
      console.error('Get import template error:', error);
      throw error;
    }
  }

  /**
   * Import faculty from file
   */
  async importFaculty(file: File): Promise<{ message: string; importedCount: number }> {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.IMPORT_FACULTY), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Faculty import failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Import faculty error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;

