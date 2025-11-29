import pythonApiClient from './pythonApiClient';

export interface CreateConversationRequest {
    userId: number;
    title: string;
    subjectId?: number;
}

export interface CreateConversationResponse {
    conversationId: number;
    userId: number;
    title: string;
    subjectId: number | null;
    messageCount: number;
    createdAt: string;
}

export interface ConversationDetails {
    conversationId: number;
    userId: number;
    subjectId: number | null;
    title: string;
    messageCount: number;
    isFlagged: boolean;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}

export interface Message {
    messageId: number;
    role: string;
    content: string;
    createdAt: string;
    metadata?: any;
    interactiveElements?: any;
    interactive_elements?: any; // Handle potential snake_case from backend
}

export interface BaseResponse<T> {
    success: boolean;
    data: T;
}

class ConversationService {
    /**
     * Create a new conversation
     */
    async createConversation(data: CreateConversationRequest): Promise<CreateConversationResponse> {
        const response = await pythonApiClient.post<BaseResponse<CreateConversationResponse>>(
            '/api/v1/conversations',
            data
        );
        return response.data.data;
    }

    /**
     * Get conversation details
     */
    async getConversation(conversationId: number, userId: number): Promise<ConversationDetails> {
        const response = await pythonApiClient.get<BaseResponse<ConversationDetails>>(
            `/api/v1/conversations/${conversationId}`,
            { user_id: userId }
        );
        return response.data.data;
    }

    /**
     * List all conversations
     */
    async listConversations(params?: {
        user_id?: number;
        subject_id?: number;
        is_flagged?: boolean;
        search?: string;
        sort_by?: "created_at" | "updated_at" | "title";
        sort_order?: "asc" | "desc";
        page?: number;
        limit?: number;
    }): Promise<any> {
        const response = await pythonApiClient.get<BaseResponse<any>>(
            '/api/v1/conversations',
            params
        );
        return response.data.data;
    }

    /**
     * Update conversation title
     */
    async updateConversation(conversationId: number, data: { userId: number; title: string }): Promise<ConversationDetails> {
        const response = await pythonApiClient.put<BaseResponse<ConversationDetails>>(
            `/api/v1/conversations/${conversationId}`,
            data
        );
        return response.data.data;
    }

    /**
     * Delete a conversation (soft delete)
     */
    async deleteConversation(conversationId: number, userId: number): Promise<void> {
        await pythonApiClient.delete(
            `/api/v1/conversations/${conversationId}?user_id=${userId}`
        );
    }
}

export const conversationService = new ConversationService();
export default conversationService;
