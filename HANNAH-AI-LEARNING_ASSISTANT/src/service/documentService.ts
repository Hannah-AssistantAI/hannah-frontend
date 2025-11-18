/**
 * Document Service
 * Handles all document-related API calls
 */

import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

// Type definitions for Document API
export interface Document {
  documentId: number;
  title: string;
  description: string | null;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: number;
  uploadedByName?: string;
  subjectId: number;
  subjectName?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  uploadedAt: string;
  processedAt: string | null;
  lastModifiedAt: string | null;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  subjectId: number;
  file: File;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  subjectId?: number;
}

export interface UpdateDocumentStatusRequest {
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
}

export interface DocumentStatus {
  documentId: number;
  status: string;
  processedAt: string | null;
  errorMessage: string | null;
}

export interface GetDocumentsParams {
  pageNumber?: number;
  pageSize?: number;
  subjectId?: number;
  status?: string;
  search?: string;
}

export interface PaginatedDocumentsResponse {
  items: Document[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Document Service Class
 */
class DocumentService {
  /**
   * Get all documents with optional filters
   */
  async getAllDocuments(params?: GetDocumentsParams): Promise<PaginatedDocumentsResponse> {
    try {
      const response = await apiClient.get<PaginatedDocumentsResponse>(
        API_ENDPOINTS.DOCUMENT.GET_ALL,
        params
      );
      return response.data;
    } catch (error) {
      console.error('Get all documents error:', error);
      throw error;
    }
  }

  /**
   * Create new document (upload)
   */
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('Title', data.title);
      if (data.description) {
        formData.append('Description', data.description);
      }
      formData.append('SubjectId', data.subjectId.toString());
      formData.append('File', data.file);

      const response = await apiClient.postFormData<Document>(
        API_ENDPOINTS.DOCUMENT.CREATE,
        formData
      );
      return response.data;
    } catch (error) {
      console.error('Create document error:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<Document> {
    try {
      const response = await apiClient.get<Document>(
        API_ENDPOINTS.DOCUMENT.GET_BY_ID(documentId)
      );
      return response.data;
    } catch (error) {
      console.error('Get document by ID error:', error);
      throw error;
    }
  }

  /**
   * Update document
   */
  async updateDocument(documentId: string, data: UpdateDocumentRequest): Promise<Document> {
    try {
      const response = await apiClient.put<Document>(
        API_ENDPOINTS.DOCUMENT.UPDATE(documentId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.DOCUMENT.DELETE(documentId));
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    data: UpdateDocumentStatusRequest
  ): Promise<void> {
    try {
      await apiClient.put(API_ENDPOINTS.DOCUMENT.UPDATE_STATUS(documentId), data);
    } catch (error) {
      console.error('Update document status error:', error);
      throw error;
    }
  }

  /**
   * Get document status
   */
  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    try {
      const response = await apiClient.get<DocumentStatus>(
        API_ENDPOINTS.DOCUMENT.GET_STATUS(documentId)
      );
      return response.data;
    } catch (error) {
      console.error('Get document status error:', error);
      throw error;
    }
  }

  /**
   * Reprocess document
   */
  async reprocessDocument(documentId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.DOCUMENT.REPROCESS(documentId));
    } catch (error) {
      console.error('Reprocess document error:', error);
      throw error;
    }
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      return await apiClient.getBlob(API_ENDPOINTS.DOCUMENT.DOWNLOAD(documentId));
    } catch (error) {
      console.error('Download document error:', error);
      throw error;
    }
  }

  /**
   * Get documents by subject
   */
  async getDocumentsBySubject(subjectId: string): Promise<Document[]> {
    try {
      const response = await apiClient.get<Document[]>(
        API_ENDPOINTS.DOCUMENT.GET_BY_SUBJECT(subjectId)
      );
      return response.data;
    } catch (error) {
      console.error('Get documents by subject error:', error);
      throw error;
    }
  }

  /**
   * Get documents by user
   */
  async getDocumentsByUser(userId: string): Promise<Document[]> {
    try {
      const response = await apiClient.get<Document[]>(
        API_ENDPOINTS.DOCUMENT.GET_BY_USER(userId)
      );
      return response.data;
    } catch (error) {
      console.error('Get documents by user error:', error);
      throw error;
    }
  }

  /**
   * Helper: Format file size to human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Helper: Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#28a745';
      case 'processing':
        return '#ffc107';
      case 'pending':
        return '#6c757d';
      case 'failed':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;

