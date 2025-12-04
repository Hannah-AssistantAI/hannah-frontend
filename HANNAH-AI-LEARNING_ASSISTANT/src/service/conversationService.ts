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

    images?: Array<{ url: string; source: string }>;  // RAG images from document chunks

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
     * Delete a conversation
     */
    async deleteConversation(conversationId: number, userId: number): Promise<void> {
        await pythonApiClient.delete(
            `/api/v1/conversations/${conversationId}?user_id=${userId}`
        );
    }

    /**
     * Share conversation and get share link
     */
    async shareConversation(conversationId: number, userId: number, enable: boolean = true): Promise<{
        conversationId: number;
        shareToken: string;
        shareUrl: string;
        isShared: boolean;
        sharedAt: string | null;
    }> {
        const response = await pythonApiClient.post<BaseResponse<{
            conversationId: number;
            shareToken: string;
            shareUrl: string;
            isShared: boolean;
            sharedAt: string | null;
        }>>(
            `/api/v1/conversations/${conversationId}/share`,
            { userId, enable }
        );
        return response.data.data;
    }

    /**
     * Get shared conversation (public, no auth)
     */
    async getSharedConversation(shareToken: string): Promise<{
        conversationId: number;
        title: string;
        messageCount: number;
        createdAt: string;
        messages: Message[];
    }> {
        const response = await pythonApiClient.get<BaseResponse<{
            conversationId: number;
            title: string;
            messageCount: number;
            createdAt: string;
            messages: Message[];
        }>>(
            `/api/v1/conversations/shared/${shareToken}`,
            undefined,
            false // No auth required for shared conversations
        );
        return response.data.data;
    }
}

export const conversationService = new ConversationService();
export default conversationService;
