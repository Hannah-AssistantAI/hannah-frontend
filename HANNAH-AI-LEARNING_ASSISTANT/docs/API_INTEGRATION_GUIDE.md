# 📚 Hướng Dẫn Tích Hợp API Phụ

## 🎯 Mục Đích
Tài liệu này hướng dẫn cách tạo và tích hợp các API phụ vào hệ thống HANNAH AI Learning Assistant.

---

## 📁 Cấu Trúc Thư Mục API

```
src/
├── config/
│   └── apiConfig.ts        # Cấu hình endpoints API
└── service/
    ├── authService.ts      # Service Authentication
    └── [yourService].ts    # Service API phụ của bạn
```

---

## 🚀 Bước 1: Cập Nhật File `apiConfig.ts`

Thêm endpoints mới vào `src/config/apiConfig.ts`:

```typescript
// src/config/apiConfig.ts

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/Auth/login',
    REGISTER: '/api/Auth/register',
  },

  // Course endpoints (Ví dụ)
  COURSE: {
    GET_ALL: '/api/Course',
    GET_BY_ID: (id: string) => `/api/Course/${id}`,
    CREATE: '/api/Course',
    UPDATE: (id: string) => `/api/Course/${id}`,
    DELETE: (id: string) => `/api/Course/${id}`,
  },

  // Thêm module mới của bạn ở đây
  YOUR_MODULE: {
    GET_ALL: '/api/YourModule',
    // ... các endpoints khác
  },
};
```

---

##[object Object] 2: Tạo Service File Mới

Tạo file service trong `src/service/`. Ví dụ: `courseService.ts`

```typescript
// src/service/courseService.ts
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/apiConfig';

// ===== ĐỊNH NGHĨA TYPES =====
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  instructor: string;
  duration: number;
  level: string;
}

// ===== TẠO AXIOS INSTANCE =====
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== SERVICE FUNCTIONS =====

/**
 * Lấy danh sách tất cả khóa học
 */
export const getAllCourses = async (): Promise<Course[]> => {
  const response = await api.get(API_ENDPOINTS.COURSE.GET_ALL);
  return response.data;
};

/**
 * Lấy thông tin chi tiết một khóa học
 */
export const getCourseById = async (id: string): Promise<Course> => {
  const response = await api.get(API_ENDPOINTS.COURSE.GET_BY_ID(id));
  return response.data;
};

/**
 * Tạo khóa học mới
 */
export const createCourse = async (data: CreateCourseData): Promise<Course> => {
  const response = await api.post(API_ENDPOINTS.COURSE.CREATE, data);
  return response.data;
};

/**
 * Cập nhật khóa học
 */
export const updateCourse = async (
  id: string,
  data: Partial<CreateCourseData>
): Promise<Course> => {
  const response = await api.put(API_ENDPOINTS.COURSE.UPDATE(id), data);
  return response.data;
};

/**
 * Xóa khóa học
 */
export const deleteCourse = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.COURSE.DELETE(id));
};

// Export default
const courseService = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};

export default courseService;
```

---

## 💻 Bước 3: Sử Dụng Service Trong Component

```typescript
// src/components/Courses/CourseList.tsx
import React, { useEffect, useState } from 'react';
import { getAllCourses, Course } from '../../service/courseService';
import toast from 'react-hot-toast';

