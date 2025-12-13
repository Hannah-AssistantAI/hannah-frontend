import { pythonApiClient } from './pythonApiClient';
import apiClient from './apiClient';

// Types for Set Current Semester
export interface SetCurrentSemesterRequest {
    currentSemester: string; // e.g., "HK1 2024-2025" or just "1"
}

export interface SetCurrentSemesterResponse {
    success: boolean;
    message: string;
    currentSemester: string;
    semesterNumber: number;
}

// Types for Full Roadmap Overview
export interface SubjectOverviewChunk {
    chunk_id: string;
    content: string;
    char_count: number;
}

export interface SubjectWithOverview {
    subject_id: number;
    code: string;
    name: string;
    semester: number;
    credits?: number;
    description?: string;
    overview?: SubjectOverviewChunk;
}

export interface SemesterGroup {
    semester_number: number;
    semester_label: string;
    is_current_semester: boolean;
    is_completed: boolean;
    subjects: SubjectWithOverview[];
}

export interface FullRoadmapResponse {
    current_semester: string;
    current_semester_number: number;
    total_semesters: number;
    semesters: SemesterGroup[];
}

// =============================================
// Types for Specialization
// =============================================
export interface Specialization {
    id: number;
    code: string;
    name: string;
    nameEn?: string;
    description?: string;
    majorCode: string;
    requiredCredits: number;
    isActive: boolean;
    totalSubjects: number;
    requiredSubjects: number;
    electiveSubjects: number;
}

export interface SetSpecializationRequest {
    specializationId: number;
}

export interface SetSpecializationResponse {
    success: boolean;
    message: string;
    specialization?: Specialization;
}

// =============================================
// Types for Student Transcript
// =============================================
export interface StudentGrade {
    id: number;
    subjectCode: string;
    subjectName: string;
    semesterNumber: number;
    semesterPeriod?: string;
    credits: number;
    grade?: number;
    status: 'Passed' | 'Failed' | 'Studying';
    isSpecialCourse: boolean;
    prerequisites?: string;
    linkedSubjectId?: number;
}

export interface SemesterSummary {
    semesterNumber: number;
    semesterLabel: string;
    totalSubjects: number;
    passedSubjects: number;
    totalCredits: number;
    earnedCredits: number;
    semesterGpa?: number;
    isCurrent: boolean;
    isCompleted: boolean;
}

export interface TranscriptSummary {
    id: number;
    studentIdFromFile?: string;
    totalSubjects: number;
    totalCreditsEarned: number;
    totalCreditsStudying: number;
    weightedGpa?: number;
    passedSubjects: number;
    failedSubjects: number;
    studyingSubjects: number;
    currentSemesterNumber: number;
    importedAt: string;
    fileName?: string;
}

export interface TranscriptDetail extends TranscriptSummary {
    grades: StudentGrade[];
    semesterSummaries: SemesterSummary[];
}

export interface UploadTranscriptResponse {
    success: boolean;
    message: string;
    transcript?: TranscriptSummary;
    warnings?: string[];
}

// Helper function to format roadmap as markdown
export const formatRoadmapAsMarkdown = (data: FullRoadmapResponse): string => {
    let content = `# 🎓 Lộ trình học tập\n\n`;
    content += `**Kỳ hiện tại**: ${data.current_semester} (Kỳ ${data.current_semester_number})\n\n`;
    content += `---\n\n`;

    for (const semester of data.semesters) {
        // Semester header with status
        const statusIcon = semester.is_current_semester
            ? '📍 **ĐANG HỌC**'
            : semester.is_completed
                ? '✅ Đã hoàn thành'
                : '📚 Sắp tới';

        content += `## ${semester.semester_label} ${statusIcon}\n\n`;

        if (semester.subjects.length === 0) {
            content += `_Chưa có môn học nào được cấu hình cho kỳ này._\n\n`;
        } else {
            for (const subject of semester.subjects) {
                content += `### ${subject.code} - ${subject.name}\n`;
                content += `- **Số tín chỉ**: ${subject.credits || 'N/A'}\n`;

                if (subject.description) {
                    content += `- **Mô tả**: ${subject.description}\n`;
                }

                if (subject.overview?.content) {
                    content += `\n**Tổng quan môn học:**\n\n`;
                    content += `${subject.overview.content}\n`;
                }

                content += `\n`;
            }
        }

        content += `---\n\n`;
    }

    return content;
};

// Service functions
const studentService = {
    /**
     * Get full roadmap overview - all semesters with CourseOverview content
     */
    getFullRoadmapOverview: async (): Promise<FullRoadmapResponse> => {
        const response = await pythonApiClient.get<FullRoadmapResponse>(
            '/api/v1/students/me/full-roadmap-overview'
        );
        return response.data;
    },

    /**
     * Get current semester overview
     */
    getCurrentSemesterOverview: async () => {
        const response = await pythonApiClient.get(
            '/api/v1/students/me/current-semester-overview'
        );
        return response.data;
    },

    /**
     * Get next semester overview
     */
    getNextSemesterOverview: async () => {
        const response = await pythonApiClient.get(
            '/api/v1/students/me/next-semester-overview'
        );
        return response.data;
    },

    /**
     * Set current semester for a student
     * @param userId - The student's user ID
     * @param currentSemester - Semester string (e.g., "HK1 2024-2025" or just "1")
     */
    setCurrentSemester: async (userId: number, currentSemester: string): Promise<SetCurrentSemesterResponse> => {
        const response = await apiClient.put<SetCurrentSemesterResponse>(
            `/api/students/${userId}/current-semester`,
            { currentSemester }
        );
        return response.data;
    },

    // =============================================
    // Specialization APIs
    // =============================================

    /**
     * Get all available specializations
     */
    getSpecializations: async (): Promise<Specialization[]> => {
        const response = await apiClient.get<Specialization[]>('/api/specializations');
        return response.data;
    },

    /**
     * Set student's specialization
     */
    setSpecialization: async (specializationId: number): Promise<SetSpecializationResponse> => {
        const response = await apiClient.put<SetSpecializationResponse>(
            '/api/students/me/specialization',
            { specializationId }
        );
        return response.data;
    },

    // =============================================
    // Transcript APIs
    // =============================================

    /**
     * Upload and parse a student transcript file
     * @param file - The .xls file from FAP
     */
    uploadTranscript: async (file: File): Promise<UploadTranscriptResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.postFormData<UploadTranscriptResponse>(
            '/api/students/me/transcript/upload',
            formData
        );
        return response.data;
    },

    /**
     * Get the latest transcript for the current user
     */
    getTranscript: async (): Promise<TranscriptDetail | null> => {
        try {
            const response = await apiClient.get<TranscriptDetail>('/api/students/me/transcript');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null; // No transcript yet
            }
            throw error;
        }
    },

    /**
     * Get all grades from the latest transcript
     */
    getGrades: async (): Promise<StudentGrade[]> => {
        const response = await apiClient.get<StudentGrade[]>('/api/students/me/transcript/grades');
        return response.data;
    },

    /**
     * Get semester summaries from the latest transcript
     */
    getSemesterSummaries: async (): Promise<SemesterSummary[]> => {
        const response = await apiClient.get<SemesterSummary[]>('/api/students/me/transcript/semesters');
        return response.data;
    },
};

export default studentService;

