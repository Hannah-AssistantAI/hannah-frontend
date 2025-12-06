import { pythonApiClient } from './pythonApiClient';

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
    }
};

export default studentService;
