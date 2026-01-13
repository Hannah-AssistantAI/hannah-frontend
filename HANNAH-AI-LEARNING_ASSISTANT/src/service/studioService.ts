import pythonApiClient from './pythonApiClient';

// --- Interfaces matching backend DTOs ---

export interface GenerateQuizRequest {
    conversationId: number;
    title: string;
    questionCount?: number;
    difficulty?: string;
    topics?: string[];
    subjectId?: number;  // Subject ID for quiz topic generation
    sourceType?: 'conversation' | 'documents' | 'hybrid';
    sourceSubjectIds?: number[];
    documentIds?: number[];  // Changed from sourceDocumentIds to match backend schema
    // 🆕 Phase 1: Session range for personalized generation
    sessionFrom?: number;
    sessionTo?: number;
}

export interface GenerateMindMapRequest {
    conversationId: number;
    title: string;
    topic: string;
    sourceType?: 'conversation' | 'documents' | 'hybrid';
    documentIds?: number[];
    topKChunks?: number;
    // 🆕 Phase 1: Session range for personalized generation
    sourceSubjectIds?: number[];
    sessionFrom?: number;
    sessionTo?: number;
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
    // 🆕 Phase 1: Session range for personalized generation
    sessionFrom?: number;
    sessionTo?: number;
}

export interface GenerateRoadmapRequest {
    conversationId: number;
    title: string;
    topic?: string;
    sourceType?: 'conversation' | 'documents' | 'hybrid';
    sourceSubjectIds?: number[];
    sourceDocumentIds?: number[];
}

export interface StudioGenerationResponse {
    quizId?: number;
    mindmapId?: number;
    reportId?: number;
    flashcardSetId?: number;
    roadmapId?: string;
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

export interface RoadmapContent {
    roadmapId: string;
    title: string;
    content: string;
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

    async generateRoadmap(data: GenerateRoadmapRequest) {
        return pythonApiClient.post<StudioGenerationResponse>('/api/v1/studio/roadmap/generate', data);
    }

    // --- Content Retrieval ---
    // Python Backend endpoints: GET /api/v1/studio/{type}/{id}/content

    async getQuizContent(id: string) {
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/quiz/${id}/content`);
    }

    async getMindMapContent(id: string) {
        // Fetch from Python Backend (MongoDB)
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/mindmap/${id}/content`);
    }

    async getReportContent(id: string) {
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/report/${id}/content`);
    }

    async getFlashcardContent(id: string) {
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/flashcard/${id}/content`);
    }

    /**
     * 🆕 Mark flashcard set as mastered - syncs progress to StudentSessionProgress
     */
    async markFlashcardMastered(flashcardSetId: string): Promise<{ success: boolean; message: string }> {
        const response = await pythonApiClient.post<any>(`/api/v1/studio/flashcard/${flashcardSetId}/mastered`);
        return response.data || response;
    }

    async getRoadmapContent(id: string) {
        return pythonApiClient.get<StudioGenerationResponse>(`/api/v1/studio/roadmap/${id}/content`);
    }

    /**
     * 🆕 Mark mindmap as mastered - syncs progress to StudentSessionProgress
     */
    async markMindmapMastered(mindmapId: number): Promise<{ success: boolean; message: string }> {
        const response = await pythonApiClient.post<any>(`/api/v1/studio/mindmap/${mindmapId}/mastered`);
        return response.data || response;
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

    async getQuestionHint(quizId: string, questionId: number): Promise<{ questionId: number, hint: string }> {
        const response = await pythonApiClient.get<any>(`/api/v1/studio/quiz/${quizId}/question/${questionId}/hint`);
        return response.data.data || response.data;
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

    async listRoadmaps(conversationId?: number) {
        const params = conversationId ? { conversation_id: conversationId } : {};
        return pythonApiClient.get<any>('/api/v1/studio/roadmaps', params);
    }

    // --- Delete Methods ---
    // Unified delete endpoint: DELETE /api/v1/studio/{item_type}/{item_id}

    async deleteQuiz(quizId: number) {
        return pythonApiClient.delete(`/api/v1/studio/quiz/${quizId}`);
    }

    async deleteMindMap(mindmapId: number) {
        return pythonApiClient.delete(`/api/v1/studio/mindmap/${mindmapId}`);
    }

    async deleteFlashcard(flashcardSetId: string) {
        return pythonApiClient.delete(`/api/v1/studio/flashcard/${flashcardSetId}`);
    }

    async deleteReport(reportId: string) {
        return pythonApiClient.delete(`/api/v1/studio/report/${reportId}`);
    }

    async deleteRoadmap(roadmapId: string) {
        return pythonApiClient.delete(`/api/v1/studio/roadmap/${roadmapId}`);
    }

    // Generic delete method (if you prefer)
    async deleteStudioItem(itemType: 'quiz' | 'mindmap' | 'flashcard' | 'report', itemId: string | number) {
        return pythonApiClient.delete(`/api/v1/studio/${itemType}/${itemId}`);
    }

    async getMindMapNodeDetails(data: GetMindMapNodeDetailsRequest) {
        return pythonApiClient.post<GetMindMapNodeDetailsResponse>('/api/v1/studio/mindmap/node-details', data);
    }

    // --- Quiz Attempt History ---

    /**
     * Get current user's attempt history for a specific quiz
     */
    async getMyQuizAttempts(quizId: number): Promise<MyQuizAttemptsResponse> {
        const response = await pythonApiClient.get<any>(`/api/v1/studio/quiz/${quizId}/my-attempts`);
        return response.data.data || response.data;
    }

    /**
     * Get detailed results of a specific quiz attempt
     */
    async getQuizAttemptDetails(quizId: number, attemptId: number): Promise<QuizAttemptDetails> {
        const response = await pythonApiClient.get<any>(`/api/v1/studio/quiz/${quizId}/attempts/${attemptId}`);
        return response.data.data || response.data;
    }
}

// Quiz Attempt History Interfaces
export interface QuizAttemptSummary {
    attempt_id: number;
    attempt_number: number;
    score: number | null;
    correct_answers: number | null;
    total_questions: number;
    time_taken_seconds: number | null;
    started_at: string | null;
    completed_at: string | null;
    is_completed: boolean;
    percentage: number;
    passed: boolean;
}

export interface MyQuizAttemptsResponse {
    quiz_id: number;
    quiz_title: string;
    total_attempts: number;
    best_score: number;
    attempts: QuizAttemptSummary[];
}

export interface QuizAttemptDetails {
    attemptId: number;
    quizId: number;
    quizTitle: string;
    userId: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeTakenSeconds: number | null;
    completedAt: string;
    attemptNumber: number;
    previousScore: number | null;
    results: QuizAnswerResult[];
}

export interface QuizAnswerResult {
    questionId: number;
    questionText: string;
    options: string[];
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
    topic: string | null;
}


export interface GetMindMapNodeDetailsRequest {
    conversationId: number;
    nodeLabel: string;
    mindmapContext?: string;
}

export interface GetMindMapNodeDetailsResponse {
    nodeLabel: string;
    description: string;
    resources: Array<{
        title: string;
        url: string;
        type: string;
    }>;
}

export const studioService = new StudioService();
export default studioService;
