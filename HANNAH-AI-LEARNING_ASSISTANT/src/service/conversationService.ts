import pythonApiClient from './pythonApiClient';

export interface CreateConversationRequest {
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
    async getConversation(conversationId: number): Promise<ConversationDetails> {
        const response = await pythonApiClient.get<BaseResponse<ConversationDetails>>(
            `/api/v1/conversations/${conversationId}`
        );
        return response.data.data;
    }

    /**
     * List all conversations
     */
    async listConversations(params?: {
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
}

export const conversationService = new ConversationService();
export default conversationService;
