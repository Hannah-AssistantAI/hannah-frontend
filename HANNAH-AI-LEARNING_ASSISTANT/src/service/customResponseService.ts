/**
 * Custom Response (FAQ) Service
 * Handles all API calls for Faculty FAQ management
 */

import pythonApiClient from './pythonApiClient';
import type {
    CustomResponse,
    CreateCustomResponseRequest,
    UpdateCustomResponseRequest,
    CustomResponseListResponse,
    MatchCustomResponseRequest,
    MatchCustomResponseResponse,
    SimilarityCheckResponse
} from '../types/CustomResponseTypes';

// Re-export types for backward compatibility (optional, but good for gradual migration)
export type {
    CustomResponse,
    CreateCustomResponseRequest,
    UpdateCustomResponseRequest,
    CustomResponseListResponse,
    MatchCustomResponseRequest,
    MatchCustomResponseResponse,
    SimilarResponseItem,
    SimilarityCheckResponse
} from '../types/CustomResponseTypes';

class CustomResponseService {
    /**
     * Get all custom responses with pagination and filters (public, no auth required)
     */
    async getPublicCustomResponses(
        subjectId?: number,
        page: number = 1,
        limit: number = 20,
        search?: string,
        sortByUsage: boolean = false
    ): Promise<CustomResponseListResponse> {
        const params: Record<string, any> = { page, limit };
        if (subjectId !== undefined) {
            params.subjectId = subjectId;
        }
        if (search) {
            params.search = search;
        }
        if (sortByUsage) {
            params.sortByUsage = sortByUsage;
        }

        const response = await pythonApiClient.get<{ data: CustomResponseListResponse }>(
            '/api/v1/custom-responses/public',
            params
        );
        return response.data.data;
    }

    /**
     * Get all custom responses with pagination and filters
     */
    async getCustomResponses(
        subjectId?: number,
        page: number = 1,
        limit: number = 20,
        search?: string
    ): Promise<CustomResponseListResponse> {
        const params: Record<string, any> = { page, limit };
        if (subjectId !== undefined) {
            params.subjectId = subjectId;
        }
        if (search) {
            params.search = search;
        }

        const response = await pythonApiClient.get<{ data: CustomResponseListResponse }>(
            '/api/v1/custom-responses',
            params
        );
        return response.data.data;
    }

    /**
     * Get a single custom response by ID
     */
    async getCustomResponseById(responseId: string): Promise<CustomResponse> {
        const response = await pythonApiClient.get<{ data: CustomResponse }>(
            `/api/v1/custom-responses/${responseId}`
        );
        return response.data.data;
    }

    /**
     * Create a new custom response (FAQ)
     */
    async createCustomResponse(
        request: CreateCustomResponseRequest
    ): Promise<CustomResponse> {
        const response = await pythonApiClient.post<{ data: CustomResponse }>(
            '/api/v1/custom-responses',
            request
        );
        return response.data.data;
    }

    /**
     * Update an existing custom response
     */
    async updateCustomResponse(
        responseId: string,
        request: UpdateCustomResponseRequest
    ): Promise<CustomResponse> {
        const response = await pythonApiClient.put<{ data: CustomResponse }>(
            `/api/v1/custom-responses/${responseId}`,
            request
        );
        return response.data.data;
    }

    /**
     * Delete a custom response
     */
    async deleteCustomResponse(responseId: string): Promise<void> {
        await pythonApiClient.delete(`/api/v1/custom-responses/${responseId}`);
    }

    /**
     * Test matching a query with custom responses (Faculty only)
     */
    async testMatch(request: MatchCustomResponseRequest): Promise<MatchCustomResponseResponse> {
        const response = await pythonApiClient.post<{ data: MatchCustomResponseResponse }>(
            '/api/v1/custom-responses/match',
            request
        );
        return response.data.data;
    }

    /**
     * Check for similar existing FAQs
     */
    async checkSimilarity(query: string, subjectId?: number): Promise<SimilarityCheckResponse> {
        const response = await pythonApiClient.post<{ data: SimilarityCheckResponse }>(
            '/api/v1/custom-responses/check-similarity',
            { query, subjectId }
        );
        return response.data.data;
    }

    /**
     * Increment usage count for a FAQ (click tracking, public endpoint)
     */
    async incrementUsageCount(responseId: string | number): Promise<void> {
        try {
            await pythonApiClient.post(
                `/api/v1/custom-responses/${responseId}/increment-usage`
            );
        } catch (error) {
            console.error('Failed to increment FAQ usage count:', error);
            // Don't throw error - tracking shouldn't block user flow
        }
    }
}

// Export singleton instance
export const customResponseService = new CustomResponseService();
export default customResponseService;
