/**
 * API Configuration
 * Centralized API endpoints and base URL configuration
 */

// Base API URL
export const API_BASE_URL = 'http://localhost:5001';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    REGISTER: '/api/Auth/register',
    LOGIN: '/api/Auth/login',
    LOGOUT: '/api/Auth/logout',
    REFRESH_TOKEN: '/api/Auth/refresh-token',
    ME: '/api/Auth/me',
    CHANGE_PASSWORD: '/api/Auth/change-password',
  },

  // User endpoints
  USER: {
    GET_ALL: '/api/Users',
    CREATE: '/api/Users',
    GET_BY_ID: (id: string) => `/api/Users/${id}`,
    UPDATE: (id: string) => `/api/Users/${id}`,
    DELETE: (id: string) => `/api/Users/${id}`,
    GET_PROFILE: (userId: string) => `/api/Users/${userId}/profile`,
    UPDATE_PROFILE: (userId: string) => `/api/Users/${userId}/profile`,
    GET_PREFERENCES: (userId: string) => `/api/Users/${userId}/preferences`,
    UPDATE_PREFERENCES: (userId: string) => `/api/Users/${userId}/preferences`,
    ACTIVATE: (userId: string) => `/api/Users/${userId}/activate`,
    DEACTIVATE: (userId: string) => `/api/Users/${userId}/deactivate`,
    UPLOAD_AVATAR: (userId: string) => `/api/Users/${userId}/avatar`,
    DELETE_AVATAR: (userId: string) => `/api/Users/${userId}/avatar`,
    GET_QUIZZES: (userId: string) => `/api/Users/${userId}/quizzes`,
    GET_IMPORT_TEMPLATE: '/api/Users/import-faculty/template',
    IMPORT_FACULTY: '/api/Users/import-faculty',
  },

  // Course endpoints (placeholder for future use)
  COURSE: {
    GET_ALL: '/api/Course',
    GET_BY_ID: (id: string) => `/api/Course/${id}`,
    CREATE: '/api/Course',
    UPDATE: (id: string) => `/api/Course/${id}`,
    DELETE: (id: string) => `/api/Course/${id}`,
  },

  // Semester endpoints (placeholder for future use)
  SEMESTER: {
    GET_ALL: '/api/Semester',
    GET_BY_ID: (id: string) => `/api/Semester/${id}`,
    CREATE: '/api/Semester',
    UPDATE: (id: string) => `/api/Semester/${id}`,
    DELETE: (id: string) => `/api/Semester/${id}`,
  },

  // Chat endpoints (placeholder for future use)
  CHAT: {
    SEND_MESSAGE: '/api/Chat/message',
    GET_HISTORY: '/api/Chat/history',
    GET_CONVERSATION: (id: string) => `/api/Chat/conversation/${id}`,
  },

  // FAQ endpoints (placeholder for future use)
  FAQ: {
    GET_ALL: '/api/FAQ',
    GET_BY_ID: (id: string) => `/api/FAQ/${id}`,
    CREATE: '/api/FAQ',
    UPDATE: (id: string) => `/api/FAQ/${id}`,
    DELETE: (id: string) => `/api/FAQ/${id}`,
  },

  // Subject endpoints
  SUBJECT: {
    GET_ALL: '/api/subjects',
    GET_BY_ID: (id: string) => `/api/subjects/${id}`,
    CREATE: '/api/subjects',
    UPDATE: (id: string) => `/api/subjects/${id}`,
    DELETE: (id: string) => `/api/subjects/${id}`,
    GET_PENDING_APPROVAL: '/api/subjects/pending-approval',
    GET_APPROVED: '/api/subjects/approved',
    GET_BY_DEGREE_LEVEL: (degreeLevel: string) => `/api/subjects/by-degree-level/${degreeLevel}`,
    SEARCH: '/api/subjects/search',
    GET_PREREQUISITES: (subjectId: string) => `/api/subjects/${subjectId}/prerequisites`,
    UPDATE_PREREQUISITES: (subjectId: string) => `/api/subjects/${subjectId}/prerequisites`,
    GET_DEPENDENTS: (subjectId: string) => `/api/subjects/${subjectId}/dependents`,
    GET_LEARNING_OUTCOMES: (subjectId: string) => `/api/subjects/${subjectId}/learning-outcomes`,
    UPDATE_LEARNING_OUTCOMES: (subjectId: string) => `/api/subjects/${subjectId}/learning-outcomes`,
    GET_COMMON_CHALLENGES: (subjectId: string) => `/api/subjects/${subjectId}/common-challenges`,
    UPDATE_COMMON_CHALLENGES: (subjectId: string) => `/api/subjects/${subjectId}/common-challenges`,
    APPROVE: (subjectId: string) => `/api/subjects/${subjectId}/approve`,
    REJECT: (subjectId: string) => `/api/subjects/${subjectId}/reject`,
  },

  // Document endpoints
  DOCUMENT: {
    GET_ALL: '/api/Documents',
    CREATE: '/api/Documents',
    GET_BY_ID: (documentId: string) => `/api/Documents/${documentId}`,
    UPDATE: (documentId: string) => `/api/Documents/${documentId}`,
    DELETE: (documentId: string) => `/api/Documents/${documentId}`,
    UPDATE_STATUS: (documentId: string) => `/api/Documents/${documentId}/status`,
    GET_STATUS: (documentId: string) => `/api/Documents/${documentId}/status`,
    REPROCESS: (documentId: string) => `/api/Documents/${documentId}/reprocess`,
    DOWNLOAD: (documentId: string) => `/api/Documents/${documentId}/download`,
    GET_BY_SUBJECT: (subjectId: string) => `/api/Documents/subject/${subjectId}`,
    GET_BY_USER: (userId: string) => `/api/Documents/user/${userId}`,
  },
};

/**
 * Helper function to build full API URL
 * @param endpoint - API endpoint path
 * @returns Full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper function to build full avatar URL
 * @param avatarPath - Avatar path (can be relative or full URL)
 * @returns Full avatar URL
 */
export const buildAvatarUrl = (avatarPath: string | null | undefined): string => {
  if (!avatarPath) {
    return '';
  }

  // If it's already a full URL (starts with http:// or https://), return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // If it starts with a slash, it's an absolute path from the server root
  if (avatarPath.startsWith('/')) {
    return `${API_BASE_URL}${avatarPath}`;
  }

  // Otherwise, assume it's a relative path and prepend the base URL
  return `${API_BASE_URL}/${avatarPath}`;
};

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

/**
 * API Response Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Request Headers
 */
export const getAuthHeaders = (token?: string | null) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Storage Keys for tokens
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

