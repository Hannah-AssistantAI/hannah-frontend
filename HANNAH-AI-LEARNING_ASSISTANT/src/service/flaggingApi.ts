/**
 * Flagging API Service
 * Handles API calls for flagging workflow (admin and faculty)
 */

import apiClient from './apiClient';
import type { ApiResponse } from './apiClient';

// TypeScript Interfaces
export interface FlaggedItem {
    id: number;
    type: 'quiz' | 'flashcard' | 'report' | 'mindmap' | 'message';
    contentId?: number;
    conversationId?: number;
    conversationOwnerId?: number;
    messageId?: number;
    reason: string;
    status: string;
    priority: string;
    flaggedByName: string;
    flaggedAt: string;
    assignedToName?: string;
    metadata?: any;
}

export interface AssignFacultyRequest {
    facultyId: number;
    note?: string;
}

export interface AssignFacultyResponse {
    id: number;
    status: string;
    assignedToFacultyId: number;
    assignedToName: string;
    assignedAt: string;
}

class FlaggingApiService {
    /**
     * Get all flagged items (Admin and Faculty)
     * GET /api/flagging/flagged
     */
    async getFlaggedItems(status?: string): Promise<FlaggedItem[]> {
        try {
            const params = status ? { status } : undefined;
            const response = await apiClient.get<FlaggedItem[]>('/api/flagging/flagged', params);
            return response.data;
        } catch (error) {
            console.error('Error fetching flagged items:', error);
            throw error;
        }
    }

    /**
     * Get flagged items assigned to current faculty
     * GET /api/flagging/assigned-to-me
     */
    async getMyAssignedFlags(): Promise<FlaggedItem[]> {
        try {
            const response = await apiClient.get<FlaggedItem[]>('/api/flagging/assigned-to-me');
            return response.data;
        } catch (error) {
            console.error('Error fetching assigned flags:', error);
            throw error;
        }
    }

    /**
     * Assign a faculty member to handle a flagged item
     * POST /api/Conversations/flagged/{flagId}/assign
     */
    async assignFacultyToFlag(flagId: number, request: AssignFacultyRequest): Promise<AssignFacultyResponse> {
        try {
            const response = await apiClient.post<AssignFacultyResponse>(
                `/api/Conversations/flagged/${flagId}/assign`,
                request
            );
            return response.data;
        } catch (error) {
            console.error(`Error assigning faculty to flag ${flagId}:`, error);
            throw error;
        }
    }
    /**
     * Resolve a flag ticket
     * POST /api/flagging/{flagId}/resolve
     */
    async resolveFlag(flagId: number, data: {
        knowledgeGapFix: string;
        studentNotification?: string;
        supplementaryDocumentId?: number | null;
        attachments?: any[];
    }): Promise<any> {
        try {
            const response = await apiClient.post(`/api/flagging/${flagId}/resolve`, data);
            return response.data;
        } catch (error) {
            console.error(`Error resolving flag ${flagId}:`, error);
            throw error;
        }
    }

    /**
     * Get my notifications (Student)
     * GET /api/flagging/notifications
     */
    async getMyNotifications(): Promise<any[]> {
        try {
            const response = await apiClient.get<any[]>('/api/flagging/notifications');
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const flaggingApiService = new FlaggingApiService();
export default flaggingApiService;
