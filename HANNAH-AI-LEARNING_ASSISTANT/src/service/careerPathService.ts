import apiClient from './apiClient';

// ============ Types ============

export interface SubjectBrief {
    id: number;
    code: string;
    name: string;
    credits: number;
    subjectType: string; // required, elective, recommended
}

export interface SemesterSubjects {
    semester: number;
    subjects: SubjectBrief[];
}

export interface CareerOutlook {
    jobTitles: string[];
    salaryRange: string;
    marketDemand: string | null; // high, medium, low
}

export interface SpecializationPreview {
    id: number;
    code: string;
    name: string;
    nameEn: string | null;
    description: string | null;
    majorCode: string;
    requiredCredits: number;
    totalSubjects: number;
    subjectsBySemester: SemesterSubjects[];
    careerOutlook: CareerOutlook | null;
}

export interface SpecializationsOverview {
    specializations: SpecializationPreview[];
    suggestedCode: string | null;
    suggestionReason: string | null;
}

// Roadmap types
export interface SubjectProgress {
    id: number;
    code: string;
    name: string;
    credits: number;
    subjectType: string;
    status: 'completed' | 'in_progress' | 'not_started';
    grade: number | null;
    isWeak: boolean;
}

export interface Milestone {
    semester: number;
    status: 'completed' | 'current' | 'upcoming';
    subjects: SubjectProgress[];
    totalCredits: number;
    completedCredits: number;
}

export interface WeakSubject {
    code: string;
    name: string;
    grade: number | null;
    reason: string | null;
}

export interface LearningRoadmap {
    currentSemester: number;
    specializationCode: string | null;
    specializationName: string | null;
    hasSpecialization: boolean;
    totalCreditsRequired: number;
    creditsCompleted: number;
    creditsRemaining: number;
    progressPercent: number;
    milestones: Milestone[];
    weakSubjects: WeakSubject[] | null;
}

// ============ Service ============

export const careerPathService = {
    /**
     * Get overview of all specializations for Career Path Explorer
     */
    getSpecializationsOverview: async (): Promise<SpecializationsOverview> => {
        const response = await apiClient.get<SpecializationsOverview>(
            '/api/v1/career-path/specializations'
        );
        return response.data;
    },

    /**
     * Get detailed preview of a specific specialization
     */
    getSpecializationPreview: async (code: string): Promise<SpecializationPreview> => {
        const response = await apiClient.get<SpecializationPreview>(
            `/api/v1/career-path/specializations/${code}/preview`
        );
        return response.data;
    },

    /**
     * Get personalized learning roadmap for current student
     */
    getLearningRoadmap: async (): Promise<LearningRoadmap> => {
        const response = await apiClient.get<LearningRoadmap>(
            '/api/v1/career-path/roadmap'
        );
        return response.data;
    }
};

export default careerPathService;
