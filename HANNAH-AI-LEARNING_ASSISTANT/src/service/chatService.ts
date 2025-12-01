import pythonApiClient from './pythonApiClient';

export interface ChatQuery {
    type: 'text';
    content: string;
}

export interface GenerationOptions {
    topK?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
}

export interface ChatInteractionRequest {
    conversationId: number;
    subjectId?: number;
    query: ChatQuery;
    generationOptions?: GenerationOptions;
}

export interface Source {
    documentId: number;
    chunkId: number;
    pageNumber: number;
    confidenceScore: number;
}

export interface InteractiveElements {
    suggestedQuestions: string[];
}

export interface ImageData {
    url: string;
    source: string;
}

export interface MessageMetadata {
    model: string;
    temperature: number;
    tokenCount: number;
    matched_subject_id?: number;
    images?: ImageData[];  // RAG images from document chunks
}

export interface AssistantMessage {
    messageId: number;
    role: 'assistant';
    responseType: 'generated' | 'custom' | 'quiz' | 'mindmap';
    content: {
        type: string;
        data: string;
        reference: any;
    };
    sources: Source[];
    interactiveElements: InteractiveElements;
    metadata: MessageMetadata;
    images?: ImageData[];  // RAG images from document chunks
}

export interface ChatInteractionResponse {
    conversationId: number;
    assistantMessage: AssistantMessage;
    processingTime: number;
    detectedSubjectId?: number | null;  // Auto-detected subject from backend
}

export interface BaseResponse<T> {
    success: boolean;
    data: T;
}

class ChatService {
    /**
     * Send a message and get AI response
     */
    async sendMessage(request: ChatInteractionRequest): Promise<ChatInteractionResponse> {
        const response = await pythonApiClient.post<BaseResponse<ChatInteractionResponse>>(
            '/api/v1/chat/interactions',
            request
        );
        return response.data.data;
    }

    /**
     * Send a simple text message
     */
    async sendTextMessage(
        conversationId: number,
        content: string,
        subjectId?: number
    ): Promise<ChatInteractionResponse> {
        return this.sendMessage({
            conversationId,
            subjectId,
            query: {
                type: 'text',
                content
            }
        });
    }
}

export const chatService = new ChatService();
export default chatService;
