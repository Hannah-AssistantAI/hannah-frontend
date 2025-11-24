import pythonApiClient from './pythonApiClient';

export interface CreateMessageRequest {
    userId: number;
    conversationId: number | null;
    role: 'student' | 'assistant' | 'user' | 'faculty' | 'system';
    content: string;
    subjectId: number | null;
}

export interface CreateMessageResponse {
    messageId: number;
    conversationId: number;
    role: 'student' | 'assistant' | 'user' | 'faculty' | 'system';
    content: string;
    createdAt: string;
}

export interface FlagMessageRequest {
    conversationId: number;
    userId: number;
    reason: string;
}

export interface FlagMessageResponse {
    messageId: number;
    isFlagged: boolean;
    flaggedBy: number;
    flaggedAt: string;
}

export interface BaseResponse<T> {
    success: boolean;
    data: T;
}

class MessageService {
    /**
     * Create a new message and optionally create a new conversation
     * If conversationId is null, a new conversation will be created automatically
     */
    async createMessage(data: CreateMessageRequest) {
        return pythonApiClient.post<BaseResponse<CreateMessageResponse>>('/api/v1/messages', data);
    }

    /**
     * Flag a message for review
     */
    async flagMessage(messageId: number, data: FlagMessageRequest): Promise<FlagMessageResponse> {
        const response = await pythonApiClient.post<BaseResponse<FlagMessageResponse>>(
            `/api/v1/messages/${messageId}/flag`,
            data
        );
        return response.data.data;
    }
}

export const messageService = new MessageService();
export default messageService;
