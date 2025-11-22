import pythonApiClient from './pythonApiClient';
import apiClient from './apiClient';

// --- Interfaces matching backend DTOs ---

export interface GenerateQuizRequest {
    conversationId: number;
    title: string;
    questionCount?: number;
    difficulty?: string;
    topics?: string[];
    sourceType?: 'conversation' | 'documents' | 'hybrid';
    sourceSubjectIds?: number[];
    sourceDocumentIds?: number[];
}

export interface GenerateMindMapRequest {
    conversationId: number;
    title: string;
    topic: string;
    sourceType?: 'conversation' | 'documents' | 'hybrid';
    documentIds?: number[];
    topKChunks?: number;
}

export interface GenerateReportRequest {
    conversationId: number;
    title: string;
    reportType: string;
    contentFormat?: string; // "markdown" by default
    sourceType?: 'conversation' | 'documents' | 'hybrid';
    sourceSubjectIds?: number[];
    sourceDocumentIds?: number[];
}

export interface GenerateFlashcardRequest {
    conversationId: number;
    title: string;
    topic: string;
    description?: string;
    cardCount: number;
    sourceType?: 'conversation' | 'documents' | 'hybrid';
    sourceSubjectIds?: number[];
    sourceDocumentIds?: number[];
}

export interface StudioGenerationResponse {
    quizId?: number;
    mindmapId?: number;
    reportId?: number;
    flashcardSetId?: number;
    content?: string;
    [key: string]: any;
}

// Content Interfaces
export interface QuizContent {
    quizId: number;
    title: string;
    questions: any[];
}

export interface MindMapContent {
    mindmapId: number;
    title: string;
    content: {
        nodes: any[];
        edges: any[];
    };
}

export interface ReportContent {
    reportId: number;
    title: string;
    content: string;
}

export interface FlashcardContent {
    flashcardSetId: number;
    title: string;
    cards: Array<{ front: string; back: string }>;
}

// --- Service ---

class StudioService {
    // --- Generation ---
    // Python Backend endpoints: POST /api/v1/studio/mindmap/generate, etc.

    async generateQuiz(data: GenerateQuizRequest) {
        // Note: Quiz generation endpoint doesn't exist in backend yet
        // This will need to be added to the Python backend
        return pythonApiClient.post<StudioGenerationResponse>('/api/v1/studio/quiz/generate', data);
    }

    async generateMindMap(data: GenerateMindMapRequest) {
        return pythonApiClient.post<StudioGenerationResponse>('/api/v1/studio/mindmap/generate', data);
    }

    async generateReport(data: GenerateReportRequest) {
        return pythonApiClient.post<StudioGenerationResponse>('/api/v1/studio/report/generate', data);
    }

    async generateFlashcard(data: GenerateFlashcardRequest) {
        return pythonApiClient.post<StudioGenerationResponse>('/api/v1/studio/flashcard/generate', data);
    }

    // --- Content Retrieval ---
    // .NET Backend endpoints: GET /api/studio/mindmaps/{id}, etc.

    async getQuizContent(id: string) {
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/quiz/${id}/content`);
    }

    async getMindMapContent(id: string) {
        // Fetch from .NET Backend (SQL Server)
        return apiClient.get<StudioGenerationResponse>(`/api/studio/mindmaps/${id}`);
    }

    async getReportContent(id: string) {
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/report/${id}`);
    }

    async getFlashcardContent(id: string) {
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/flashcard/${id}`);
    }

    async submitQuiz(quizId: string, answers: Array<{ questionId: number, selectedAnswer: string, timeSpentSeconds?: number }>) {
        return pythonApiClient.post<any>(`/api/v1/studio/quiz/${quizId}/submit`, {
            answers: answers.map(a => ({
                questionId: a.questionId,
                selectedAnswer: a.selectedAnswer,
                timeSpentSeconds: a.timeSpentSeconds || null
            })),
            completedAt: new Date().toISOString()
        });
    }

    // --- List Methods ---
    async listMindMaps(conversationId?: number) {
        const params = conversationId ? { conversation_id: conversationId } : {};
        return pythonApiClient.get<any>('/api/v1/studio/mindmaps', params);
    }

    async listQuizzes(conversationId?: number) {
        const params = conversationId ? { conversation_id: conversationId } : {};
        return pythonApiClient.get<any>('/api/v1/studio/quizzes', params);
    }

    async listFlashcards(conversationId?: number) {
        const params = conversationId ? { conversation_id: conversationId } : {};
        return pythonApiClient.get<any>('/api/v1/studio/flashcards', params);
    }

    async listReports(conversationId?: number) {
        const params = conversationId ? { conversation_id: conversationId } : {};
        return pythonApiClient.get<any>('/api/v1/studio/reports', params);
    }
}

export const studioService = new StudioService();
export default studioService;
