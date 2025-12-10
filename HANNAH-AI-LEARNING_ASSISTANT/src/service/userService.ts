/**
 * User Service
 * Handles all user-related API calls
 */

import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

// Type definitions for User API
export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string;
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
  userId: number;
  phone: string | null;
  dateOfBirth: string | null;
  bio: string | null;
  studentId: string | null;
  studentSpecialty: string | null;
  currentSemester: string | null; // e.g., "HK1 2024-2025"
  facultySpecialty: string | null; // Teaching specialty for faculty
  yearsOfExperience: number | null; // Years of experience for faculty
  notificationPreferences: any | null; // Adjust based on actual structure
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateProfileRequest {
  phone?: string;
  dateOfBirth?: string;
  bio?: string;
  studentSpecialty?: string;
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

export interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
  role?: string;
  specialty?: string;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedUsersResponse {
  items: User[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
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
      // The API might return a paginated object even if we don't ask it to.
      // If so, we extract the 'items' array. If not, we assume the response is the array itself.
      if (response.data && Array.isArray((response.data as any).items)) {
        return (response.data as any).items;
      }
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
  async deactivateUser(userId: string, reason?: string): Promise<void> {
    try {
      // Only send a body if a reason is provided.
      const payload = reason ? { reason } : undefined;
      await apiClient.put(API_ENDPOINTS.USER.DEACTIVATE(userId), payload);
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
      const formData = new FormData();
      formData.append('Avatar', file);
      // The API returns a wrapped response: { success: boolean, data: { avatarUrl: string } }
      const response = await apiClient.postFormData<{ success: boolean; data: { avatarUrl: string } }>(
        API_ENDPOINTS.USER.UPLOAD_AVATAR(userId),
        formData
      );
      // Return the inner data object which contains the avatarUrl
      return response.data.data;
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
   * Get all faculty users
   * Helper method to fetch only users with role 'faculty'
   */
  async getFacultyList(): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => user.role === 'faculty');
    } catch (error) {
      console.error('Get faculty list error:', error);
      throw error;
    }
  }

  /**
   * Get import faculty template
   */
  async getImportTemplate(): Promise<Blob> {
    try {
      return await apiClient.getBlob(API_ENDPOINTS.USER.GET_IMPORT_TEMPLATE);
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
      const formData = new FormData();
      formData.append('ExcelFile', file); // Match the API parameter name 'ExcelFile' from Swagger
      const response = await apiClient.postFormData<{ message: string; importedCount: number }>(
        API_ENDPOINTS.USER.IMPORT_FACULTY,
        formData
      );
      return response.data;
    } catch (error) {
      console.error('Import faculty error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;

