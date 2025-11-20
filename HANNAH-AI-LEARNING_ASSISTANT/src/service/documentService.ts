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
  fileUrl: string; // Changed from filePath to match backend
  fileSize: number;
  mimeType: string; // Changed from fileType to match backend
  uploadedBy: number;
  uploadedByName?: string;
  subjectId: number;
  subjectName?: string;
  processingStatus: string; // Changed from status to match backend
  isProcessed: boolean;
  processingError: string | null;
  // Approval fields
  approvalStatus?: string; // pending, approved, rejected
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  metadata: any;
  createdAt: string; // Changed from uploadedAt to match backend
  updatedAt: string | null; // Changed from lastModifiedAt to match backend
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
  processingStatus: string; // Changed from status to match backend
}

export interface DocumentStatus {
  documentId: number;
  processingStatus: string; // Changed from status to match backend
  isProcessed: boolean;
  processingError: string | null;
  updatedAt: string | null;
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
  getStatusColor(processingStatus: string): string {
    switch (processingStatus?.toLowerCase()) {
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

  /**
   * LUỒNG 4: Document Processing Flow
   * Poll document status until processing is complete
   */
  async pollDocumentStatus(
    documentId: string,
    onStatusChange?: (status: DocumentStatus) => void,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<DocumentStatus> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          attempts++;
          const status = await this.getDocumentStatus(documentId);

          if (onStatusChange) {
            onStatusChange(status);
          }

          // Check if processing is complete
          if (status.processingStatus === 'completed' || status.processingStatus === 'failed') {
            clearInterval(pollInterval);
            resolve(status);
            return;
          }

          // Check max attempts
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            reject(new Error('Document processing timeout'));
            return;
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, intervalMs);
    });
  }

  /**
   * Get processing statistics
   */
  async getProcessingStatistics(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageProcessingTime: number;
  }> {
    try {
      const response = await apiClient.get<{
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        averageProcessingTime: number;
      }>('/api/Documents/statistics');
      return response.data;
    } catch (error) {
      console.error('Get processing statistics error:', error);
      throw error;
    }
  }

  /**
   * Get recent document processing activities
   */
  async getRecentProcessingActivities(limit: number = 10): Promise<{
    documentId: number;
    title: string;
    status: string;
    uploadedAt: string;
    processedAt: string | null;
    processingTime: number | null;
  }[]> {
    try {
      const response = await apiClient.get<{
        documentId: number;
        title: string;
        status: string;
        uploadedAt: string;
        processedAt: string | null;
        processingTime: number | null;
      }[]>(`/api/Documents/recent-activities?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get recent processing activities error:', error);
      throw error;
    }
  }

  /**
   * APPROVAL FLOW: Get pending documents (Admin only)
   */
  async getPendingDocuments(subjectId?: number): Promise<Document[]> {
    try {
      const url = subjectId
        ? `/api/documents/pending?subjectId=${subjectId}`
        : '/api/documents/pending';
      const response = await apiClient.get<Document[]>(url);
      return response.data;
    } catch (error) {
      console.error('Get pending documents error:', error);
      throw error;
    }
  }

  /**
   * APPROVAL FLOW: Approve document (Admin only)
   */
  async approveDocument(documentId: number): Promise<{
    documentId: number;
    approvalStatus: string;
    approvedAt: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post<{
        documentId: number;
        approvalStatus: string;
        approvedAt: string;
        message: string;
      }>(`/api/documents/${documentId}/approve`, {
        isApproved: true
      });
      return response.data;
    } catch (error) {
      console.error('Approve document error:', error);
      throw error;
    }
  }

  /**
   * APPROVAL FLOW: Reject document (Admin only)
   */
  async rejectDocument(documentId: number, rejectionReason: string): Promise<{
    documentId: number;
    approvalStatus: string;
    approvedAt: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post<{
        documentId: number;
        approvalStatus: string;
        approvedAt: string;
        message: string;
      }>(`/api/documents/${documentId}/approve`, {
        isApproved: false,
        rejectionReason
      });
      return response.data;
    } catch (error) {
      console.error('Reject document error:', error);
      throw error;
    }
  }

  /**
   * Helper: Get approval status badge color
   */
  getApprovalStatusColor(approvalStatus: string): string {
    switch (approvalStatus?.toLowerCase()) {
      case 'approved':
        return '#28a745'; // green
      case 'rejected':
        return '#dc3545'; // red
      case 'pending':
        return '#ffc107'; // yellow
      default:
        return '#6c757d'; // gray
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;

