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
        // Note: Quiz retrieval endpoint doesn't exist in backend yet
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/quiz/${id}`);
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
}

export const studioService = new StudioService();
export default studioService;
