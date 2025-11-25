/**
 * Custom Response (FAQ) Service
 * Handles all API calls for Faculty FAQ management
 */

import pythonApiClient from './pythonApiClient';

export interface CustomResponse {
    responseId: number;
    subjectId: number | null;
    createdBy: number;
    triggerKeywords: string[];
    questionPattern: string | null;
    responseContent: string;
    isActive: boolean;
    usageCount: number;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomResponseRequest {
    subjectId: number | null;
    triggerKeywords: string[];
    questionPattern?: string;
    responseContent: string;
    isActive: boolean;
}

export interface UpdateCustomResponseRequest {
    triggerKeywords?: string[];
    questionPattern?: string;
    responseContent?: string;
    isActive?: boolean;
}

export interface CustomResponseListResponse {
    items: CustomResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MatchCustomResponseRequest {
    query: string;
    subjectId?: number;
}

export interface MatchCustomResponseResponse {
    matched: boolean;
    response: CustomResponse | null;
}

class CustomResponseService {
    /**
     * Get all custom responses with pagination and filters
     */
    async getCustomResponses(
        subjectId?: number,
        page: number = 1,
        limit: number = 20
    ): Promise<CustomResponseListResponse> {
        const params: Record<string, any> = { page, limit };
        if (subjectId) {
            params.subjectId = subjectId;
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
    async getCustomResponseById(responseId: number): Promise<CustomResponse> {
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
        responseId: number,
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
    async deleteCustomResponse(responseId: number): Promise<void> {
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
}

// Export singleton instance
export const customResponseService = new CustomResponseService();
export default customResponseService;
