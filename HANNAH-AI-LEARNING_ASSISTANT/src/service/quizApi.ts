/**
 * Quiz API Service
 * Handles all quiz-related API calls for Faculty analytics
 */

import apiClient from './apiClient';

// ==================== INTERFACES ====================

export interface QuizDto {
    quizId: number;
    title: string;
    questionCount: number;
    timeLimitMinutes?: number;
    attemptCount: number;
    averageScore?: number;
    createdAt: string;
}

export interface QuizDetailDto {
    quizId: number;
    conversationId?: number;
    title: string;
    description?: string;
    questionCount: number;
    timeLimitMinutes?: number;
    sourceSubjectIds?: number[];
    sourceDocumentIds?: number[];
    attemptCount: number;
    averageScore?: number;
    createdAt: string;
}

export interface QuizResultsDto {
    quizId: number;
    title: string;
    totalAttempts: number;
    uniqueUsers: number;
    averageScore?: number;
    highestScore?: number;
    lowestScore?: number;
    passRate?: number; // % with score >= 50
    averageTimeTaken?: number; // ⚠️ In SECONDS
    scoreDistribution: {
        '90-100': number; // Excellent
        '80-89': number; // Good
        '70-79': number; // Average
        '60-69': number; // Below Average
        '0-59': number; // Failed
    };
}

export interface QuestionDifficultyDto {
    questionId: number;
    correctRate: number; // 0-1
    difficulty: string; // "Easy" | "Medium" | "Hard"
}

export interface TimeStatisticsDto {
    averageTime: number; // In seconds
    minTime: number;
    maxTime: number;
}

export interface QuizStatisticsDto {
    quizId: number;
    totalAttempts: number; // All attempts (including incomplete)
    completedAttempts: number; // Only completed
    averageScore?: number;
    medianScore?: number;
    standardDeviation?: number;
    questionDifficulty: QuestionDifficultyDto[]; // ⚠️ Currently EMPTY - placeholder!
    timeStatistics: TimeStatisticsDto;
}

export interface QuizAttemptDto {
    attemptId: number;
    userId: number;
    userName?: string;
    score?: number;
    startedAt: string;
    submittedAt?: string;
    timeTaken?: number; // In seconds
    isCompleted: boolean;
}

export interface QuizAttemptQuestionDto {
    questionId: number;
    content: string;
    options: string[];
    correctOptionIndex: number;
    selectedOptionIndex: number;
    explanation?: string;
    isCorrect: boolean;
}

export interface QuizAttemptDetailDto {
    attemptId: number;
    quizId: number;
    quizTitle: string;
    userId: number;
    userName: string;
    courseId?: string;
    courseName?: string;
    score: number;
    maxScore: number;
    percentage: number;
    startedAt: string;
    submittedAt?: string;
    timeTaken?: number;
    isCompleted: boolean;
    isFlagged: boolean;
    flagReason?: string;
    questions: QuizAttemptQuestionDto[];
}

export interface PaginatedQuizListDto {
    items: QuizDto[];
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface GetQuizzesParams {
    SubjectId?: number;
    ConversationId?: number;
    CreatedBy?: number;
    PageNumber?: number;
    PageSize?: number;
}

// ==================== API RESPONSE WRAPPER ====================

interface BackendApiResponse<T> {
    success: boolean;
    data: T;
    pagination?: {
        pageNumber: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    message?: string;
    timestamp: string;
}

// ==================== QUIZ API SERVICE ====================

class QuizApiService {
    /**
     * Get list of quizzes with optional filters
     * GET /api/Quizzes
     */
    async getQuizzes(params?: GetQuizzesParams): Promise<PaginatedQuizListDto> {
        try {
            const response = await apiClient.get<BackendApiResponse<QuizDto[]>>('/api/Quizzes', params);

            return {
                items: response.data.data,
                pageNumber: response.data.pagination?.pageNumber || 1,
                totalPages: response.data.pagination?.totalPages || 1,
                totalCount: response.data.pagination?.totalCount || 0,
                hasNextPage: response.data.pagination?.hasNextPage || false,
                hasPreviousPage: response.data.pagination?.hasPreviousPage || false,
            };
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            throw error;
        }
    }

    /**
     * Get quiz details by ID
     * GET /api/Quizzes/{quizId}
     */
    async getQuizById(quizId: number): Promise<QuizDetailDto> {
        try {
            const response = await apiClient.get<BackendApiResponse<QuizDetailDto>>(`/api/Quizzes/${quizId}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching quiz ${quizId}:`, error);
            throw error;
        }
    }

    /**
     * Get quiz results (Faculty & Admin only)
     * GET /api/Quizzes/{quizId}/results
     */
    async getQuizResults(quizId: number): Promise<QuizResultsDto> {
        try {
            const response = await apiClient.get<BackendApiResponse<QuizResultsDto>>(`/api/Quizzes/${quizId}/results`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching quiz results for ${quizId}:`, error);
            throw error;
        }
    }

    /**
     * Get quiz statistics (Faculty & Admin only)
     * GET /api/Quizzes/{quizId}/statistics
     */
    async getQuizStatistics(quizId: number): Promise<QuizStatisticsDto> {
        try {
            const response = await apiClient.get<BackendApiResponse<QuizStatisticsDto>>(`/api/Quizzes/${quizId}/statistics`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching quiz statistics for ${quizId}:`, error);
            throw error;
        }
    }

    /**
     * Get quiz attempts
     * GET /api/Quizzes/{quizId}/attempts
     */
    async getQuizAttempts(quizId: number): Promise<QuizAttemptDto[]> {
        try {
            const response = await apiClient.get<BackendApiResponse<QuizAttemptDto[]>>(`/api/Quizzes/${quizId}/attempts`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching quiz attempts for ${quizId}:`, error);
            throw error;
        }
    }

    /**
     * Delete quiz
     * DELETE /api/Quizzes/{quizId}
     */
    async deleteQuiz(quizId: number): Promise<void> {
        try {
            await apiClient.delete<BackendApiResponse<null>>(`/api/Quizzes/${quizId}`);
        } catch (error) {
            console.error(`Error deleting quiz ${quizId}:`, error);
            throw error;
        }
    }

    /**
     * Get quiz attempt details including questions and answers
     * GET /api/QuizAttempts/{attemptId}
     */
    async getQuizAttemptDetail(attemptId: number): Promise<QuizAttemptDetailDto> {
        try {
            const response = await apiClient.get<BackendApiResponse<QuizAttemptDetailDto>>(`/api/QuizAttempts/${attemptId}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching quiz attempt ${attemptId}:`, error);
            throw error;
        }
    }

    /**
     * Flag a quiz attempt
     * POST /api/QuizAttempts/{attemptId}/flag
     */
    async flagQuizAttempt(attemptId: number, reason: string): Promise<void> {
        try {
            await apiClient.post<BackendApiResponse<null>>(`/api/QuizAttempts/${attemptId}/flag`, { reason });
        } catch (error) {
            console.error(`Error flagging attempt ${attemptId}:`, error);
            throw error;
        }
    }

    /**
     * Unflag a quiz attempt
     * DELETE /api/QuizAttempts/{attemptId}/flag
     */
    async unflagQuizAttempt(attemptId: number): Promise<void> {
        try {
            await apiClient.delete<BackendApiResponse<null>>(`/api/QuizAttempts/${attemptId}/flag`);
        } catch (error) {
            console.error(`Error unflagging attempt ${attemptId}:`, error);
            throw error;
        }
    }

    /**
     * Get all quizzes with statistics (helpful for analytics dashboard)
     * This combines getQuizzes + getQuizStatistics for each quiz
     */
    async getQuizzesWithStatistics(params?: GetQuizzesParams): Promise<Array<QuizDto & { statistics?: QuizStatisticsDto; results?: QuizResultsDto }>> {
        try {
            const quizList = await this.getQuizzes(params);

            // Fetch statistics for each quiz in parallel
            const quizzesWithStats = await Promise.all(
                quizList.items.map(async (quiz) => {
                    try {
                        const [statistics, results] = await Promise.all([
                            this.getQuizStatistics(quiz.quizId).catch(() => undefined),
                            this.getQuizResults(quiz.quizId).catch(() => undefined),
                        ]);

                        return {
                            ...quiz,
                            statistics,
                            results,
                        };
                    } catch (error) {
                        // If fetching stats fails for a quiz, return it without stats
                        console.warn(`Failed to fetch stats for quiz ${quiz.quizId}`, error);
                        return quiz;
                    }
                })
            );

            return quizzesWithStats;
        } catch (error) {
            console.error('Error fetching quizzes with statistics:', error);
            throw error;
        }
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format seconds to readable time string
 */
export const formatTime = (seconds: number | undefined): string => {
    if (seconds === undefined || seconds === null) return 'N/A';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
};

/**
 * Get label for score range
 */
export const getScoreRangeLabel = (rangeKey: string): string => {
    const labels: Record<string, string> = {
        '90-100': 'Excellent',
        '80-89': 'Good',
        '70-79': 'Average',
        '60-69': 'Below Average',
        '0-59': 'Failed',
    };
    return labels[rangeKey] || rangeKey;
};

/**
 * Get color for score range (for charts/badges)
 */
export const getScoreRangeColor = (rangeKey: string): string => {
    const colors: Record<string, string> = {
        '90-100': '#10b981', // green
        '80-89': '#3b82f6', // blue
        '70-79': '#f59e0b', // yellow
        '60-69': '#ef4444', // orange-red
        '0-59': '#991b1b', // dark-red
    };
    return colors[rangeKey] || '#6b7280';
};

/**
 * Calculate pass/fail statistics
 */
export const getPassFailStats = (results: QuizResultsDto) => {
    const passRate = results.passRate || 0;
    const totalStudents = results.uniqueUsers || 0;

    return {
        passed: Math.round(totalStudents * passRate / 100),
        failed: Math.round(totalStudents * (100 - passRate) / 100),
        passPercentage: passRate.toFixed(1) + '%',
        failPercentage: (100 - passRate).toFixed(1) + '%',
    };
};

// Export singleton instance
export const quizApiService = new QuizApiService();
export default quizApiService;
