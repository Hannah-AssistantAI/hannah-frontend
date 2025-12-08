import apiClient from './apiClient';

// Constants
const ORIENTATION_ENDPOINTS = {
    GET_CONTENT: '/api/Orientation/content',
    UPDATE_CONTENT: '/api/Orientation/content',
};

// Types - Export interface for use in components
export interface OrientationContent {
    subjectId: number;
    subjectName: string;
    subjectCode: string;
    content: string;
    lastUpdatedAt: string | null;
    lastUpdatedBy: string | null;
}

/**
 * Orientation Service
 * Handles API calls for the Orientation document content
 */
class OrientationService {
    /**
     * Get orientation content
     */
    async getContent(): Promise<OrientationContent> {
        try {
            const response = await apiClient.get<OrientationContent>(ORIENTATION_ENDPOINTS.GET_CONTENT);
            return response.data;
        } catch (error) {
            console.error('Get orientation content error:', error);
            throw error;
        }
    }

    /**
     * Update orientation content (Admin only)
     */
    async updateContent(content: string): Promise<OrientationContent> {
        try {
            const response = await apiClient.put<OrientationContent>(
                ORIENTATION_ENDPOINTS.UPDATE_CONTENT,
                { content }
            );
            return response.data;
        } catch (error) {
            console.error('Update orientation content error:', error);
            throw error;
        }
    }
}

const orientationService = new OrientationService();
export default orientationService;
