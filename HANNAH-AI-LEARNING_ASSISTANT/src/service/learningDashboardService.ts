import apiClient from './apiClient';

// ============ Types ============

/**
 * Subject progress summary in the dashboard
 */
export interface SubjectProgressSummary {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    completionPercentage: number;
    currentWeek: number;
    quizzesTaken: number;
    averageQuizScore: number | null;
}

/**
 * Learning dashboard overview response
 */
export interface LearningDashboard {
    userId: number;
    currentSemester: number;
    specializationName: string | null;
    totalSubjects: number;
    subjects: SubjectProgressSummary[];
    lastUpdated: string;
}

/**
 * Session (week) progress details
 */
export interface SessionProgress {
    sessionNumber: number;
    topic: string | null;
    type: string | null;
    learningOutcome: string | null;
    materials: string | null;
    status: 'not_started' | 'in_progress' | 'completed';
    materialsRead: boolean;
    quizCompleted: boolean;
    quizScore: number | null;
    needsReview: boolean;  // 🆕 Phase 2: Warning for low quiz scores
    tasksCompleted: boolean;
    completedAt: string | null;
    notes: string | null;
}

/**
 * Subject sessions response
 */
export interface SubjectSessions {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    totalSessions: number;
    completedCount: number;
    inProgressCount: number;
    sessions: SessionProgress[];
}

/**
 * Request to update session progress
 */
export interface UpdateSessionProgressRequest {
    materialsRead?: boolean;
    quizCompleted?: boolean;
    quizScore?: number;
    tasksCompleted?: boolean;
    status?: string;
    notes?: string;
}

/**
 * Weak topic from concept mastery
 */
export interface WeakTopic {
    topicName: string;
    subjectCode: string;
    masteryLevel: number;
    practiceCount: number;
    lastPracticedAt: string | null;
}

/**
 * User's weak topics response
 */
export interface WeakTopicsResponse {
    userId: number;
    weakTopics: WeakTopic[];
}

/**
 * 🆕 CLO (Course Learning Outcome) Progress
 */
export interface CLOProgress {
    cloName: string;
    description: string | null;
    totalSessions: number;
    completedSessions: number;
    progressPercentage: number;
    sessionNumbers: number[];
}

/**
 * 🆕 CLO Progress Response
 */
export interface CLOProgressResponse {
    subjectId: number;
    subjectCode: string;
    totalCLOs: number;
    overallProgress: number;
    clos: CLOProgress[];
}

/**
 * 🆕 Document-Session Mapping
 */
export interface DocumentSessionMapping {
    sessionNumber: number;
    sessionTopic: string | null;
    linkedCLOs: string[];
    documents: {
        id: number;
        title: string;
        category: string | null;
        detectedSlot: string | null;
    }[];
}

/**
 * 🆕 Documents by Session Response
 */
export interface DocumentsBySessionResponse {
    subjectId: number;
    subjectCode: string;
    totalSessions: number;
    sessionsWithDocuments: number;
    sessions: DocumentSessionMapping[];
}

/**
 * 🆕 Phase 1: Subject available for content generation
 */
export interface SubjectForGeneration {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    hasDocuments: boolean;
    documentCount: number;
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    suggestedSessionRange: {
        from: number;
        to: number;
    } | null;
}

/**
 * 🆕 Phase 1: Response for subjects-for-generation API
 */
export interface SubjectsForGenerationResponse {
    semester: number;
    userId: number;
    subjects: SubjectForGeneration[];
}

// ============ Service ============

export const learningDashboardService = {
    /**
     * Get learning dashboard overview for authenticated student
     */
    getDashboard: async (): Promise<LearningDashboard> => {
        const response = await apiClient.get<LearningDashboard>(
            '/api/v1/learning/dashboard'
        );
        return response.data;
    },

    /**
     * 🆕 Phase 1: Get subjects available for content generation (Quiz/Flashcard/Mindmap)
     * Returns current semester subjects with document availability and session progress
     */
    getSubjectsForGeneration: async (): Promise<SubjectsForGenerationResponse> => {
        const response = await apiClient.get<SubjectsForGenerationResponse>(
            '/api/v1/learning/subjects-for-generation'
        );
        return response.data;
    },

    /**
     * Get detailed session progress for a specific subject
     */
    getSubjectSessions: async (subjectId: number): Promise<SubjectSessions> => {
        const response = await apiClient.get<SubjectSessions>(
            `/api/v1/learning/subjects/${subjectId}/sessions`
        );
        return response.data;
    },

    /**
     * Update progress for a specific session
     */
    updateSessionProgress: async (
        subjectId: number,
        sessionNumber: number,
        data: UpdateSessionProgressRequest
    ): Promise<{ success: boolean; status: string; completedAt: string | null }> => {
        const response = await apiClient.put<{ success: boolean; status: string; completedAt: string | null }>(
            `/api/v1/learning/subjects/${subjectId}/sessions/${sessionNumber}`,
            data
        );
        return response.data;
    },

    /**
     * Get weak topics for a user (from ConceptMastery)
     */
    getWeakTopics: async (userId: number): Promise<WeakTopicsResponse> => {
        const response = await apiClient.get<WeakTopicsResponse>(
            `/api/v1/personalization/weak-topics/${userId}`
        );
        return response.data;
    },

    /**
     * Get my learning context (for current user)
     */
    getMyLearningContext: async () => {
        const response = await apiClient.get('/api/v1/personalization/context/me');
        return response.data;
    },

    // ============ 🆕 Phase 1.5-1.6 APIs ============

    /**
     * Get CLO (Course Learning Outcome) progress for a subject
     */
    getCLOProgress: async (subjectId: number): Promise<CLOProgressResponse> => {
        const response = await apiClient.get<CLOProgressResponse>(
            `/api/v1/learning/subjects/${subjectId}/clo-progress`
        );
        return response.data;
    },

    /**
     * Get documents grouped by session for a subject
     */
    getDocumentsBySession: async (subjectId: number): Promise<DocumentsBySessionResponse> => {
        const response = await apiClient.get<DocumentsBySessionResponse>(
            `/api/v1/learning/subjects/${subjectId}/documents-by-session`
        );
        return response.data;
    },

    /**
     * Get documents grouped by CLO for a subject
     */
    getDocumentsByCLO: async (subjectId: number) => {
        const response = await apiClient.get(
            `/api/v1/learning/subjects/${subjectId}/documents-by-clo`
        );
        return response.data;
    },

    /**
     * 🆕 Batch update multiple sessions at once (improves UX)
     */
    batchUpdateSessionProgress: async (
        subjectId: number,
        updates: Array<{
            sessionNumber: number;
            materialsRead?: boolean;
            tasksCompleted?: boolean;
        }>
    ): Promise<{ success: boolean; updated: number }> => {
        const response = await apiClient.post<{ success: boolean; updated: number }>(
            `/api/v1/learning/subjects/${subjectId}/sessions/batch`,
            { updates }
        );
        return response.data;
    }
};

export default learningDashboardService;
