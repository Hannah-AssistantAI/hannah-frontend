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

    /**
     * Send mindmap chat message (lightweight, no DB save)
     */
    async sendMindmapChat(
        conversationId: number,
        nodeLabel: string,
        mindmapTopic: string,
        message: string,
        chatHistory: Array<{role: string, content: string}> = []
    ): Promise<{response: string}> {
        const response = await pythonApiClient.post<BaseResponse<{response: string}>>(
            '/api/v1/studio/mindmap/chat',
            {
                conversation_id: conversationId,
                node_label: nodeLabel,
                mindmap_topic: mindmapTopic,
                message,
                chat_history: chatHistory
            }
        );
        return response.data.data;
    }

    /**
     * Send mindmap chat with streaming (real-time response)
     */
    async sendMindmapChatStream(
        conversationId: number,
        nodeLabel: string,
        mindmapTopic: string,
        message: string,
        chatHistory: Array<{role: string, content: string}> = [],
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const response = await fetch('http://localhost:8001/api/v1/studio/mindmap/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                node_label: nodeLabel,
                mindmap_topic: mindmapTopic,
                message,
                chat_history: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error('Streaming failed');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (reader) {
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        if (data.content) {
                            fullResponse += data.content;
                            onChunk(data.content);
                        }
                        if (data.done) {
                            return fullResponse;
                        }
                    }
                }
            }
        }

        return fullResponse;
    }
}

export const chatService = new ChatService();
export default chatService;
