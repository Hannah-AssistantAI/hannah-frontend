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
    }
};

export default learningDashboardService;
