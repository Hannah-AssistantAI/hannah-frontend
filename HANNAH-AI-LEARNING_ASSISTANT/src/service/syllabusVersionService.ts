import apiClient from './apiClient';

// ============================================================================
// SYLLABUS VERSION TYPES
// ============================================================================

export interface SyllabusVersionSummary {
    id: number;
    versionNumber: number;
    isActive: boolean;
    decisionNo?: string;
    syllabusApprovedDate?: string;
    createdAt: string;
    deactivatedAt?: string;
    versionNotes?: string;
    createdByUserName?: string;
    documentCount: number;
    activeDocumentCount: number;
}

export interface SyllabusVersionDetail extends SyllabusVersionSummary {
    subjectId: number;
    subjectCode?: string;
    subjectName?: string;
    description?: string;
    prerequisites?: string;
    learningOutcomes?: string;
    assessments?: string;
    sessions?: string;
    syllabusMaterials?: string;
    studentTasks?: string;
    tools?: string;
    degreeLevel?: string;
    timeAllocation?: string;
    scoringScale?: string;
    minAvgMarkToPass?: number;
}

export interface SyllabusVersionComparison {
    version1: SyllabusVersionSummary;
    version2: SyllabusVersionSummary;
    differences: Array<{
        fieldName: string;
        oldValue?: string;
        newValue?: string;
        changeType: 'added' | 'removed' | 'modified';
    }>;
}

export interface RollbackRequest {
    subjectId: number;
    targetVersionNumber: number;
    reactivateDocuments?: boolean;
}

export interface RollbackResult {
    success: boolean;
    message: string;
    newVersionId?: number;
    newVersionNumber?: number;
    archivedVersionId?: number;
    deactivatedDocumentCount: number;
}

// ============================================================================
// SYLLABUS VERSION SERVICE
// ============================================================================

const BASE_URL = '/api/SyllabusVersions';

/**
 * Get syllabus version history for a subject.
 */
const getVersionHistory = async (subjectId: number): Promise<SyllabusVersionSummary[]> => {
    const response = await apiClient.get<SyllabusVersionSummary[]>(
        `${BASE_URL}/subject/${subjectId}/history`
    );
    return response.data;
};

/**
 * Get details of a specific syllabus version.
 */
const getVersion = async (subjectId: number, versionNumber: number): Promise<SyllabusVersionDetail> => {
    const response = await apiClient.get<SyllabusVersionDetail>(
        `${BASE_URL}/subject/${subjectId}/version/${versionNumber}`
    );
    return response.data;
};

/**
 * Get the currently active syllabus version for a subject.
 */
const getActiveVersion = async (subjectId: number): Promise<SyllabusVersionDetail | null> => {
    try {
        const response = await apiClient.get<SyllabusVersionDetail>(
            `${BASE_URL}/subject/${subjectId}/active`
        );
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Rollback to a previous syllabus version.
 */
const rollbackToVersion = async (request: RollbackRequest): Promise<RollbackResult> => {
    const response = await apiClient.post<RollbackResult>(
        `${BASE_URL}/rollback`,
        request
    );
    return response.data;
};

/**
 * Compare two syllabus versions.
 */
const compareVersions = async (
    subjectId: number,
    versionNumber1: number,
    versionNumber2: number
): Promise<SyllabusVersionComparison> => {
    const response = await apiClient.get<SyllabusVersionComparison>(
        `${BASE_URL}/subject/${subjectId}/compare`,
        { params: { versionNumber1, versionNumber2 } }
    );
    return response.data;
};

/**
 * Deactivate all documents for a subject.
 */
const deactivateDocuments = async (subjectId: number): Promise<{ deactivatedCount: number }> => {
    const response = await apiClient.post<{ deactivatedCount: number }>(
        `${BASE_URL}/subject/${subjectId}/deactivate-documents`
    );
    return response.data;
};

const syllabusVersionService = {
    getVersionHistory,
    getVersion,
    getActiveVersion,
    rollbackToVersion,
    compareVersions,
    deactivateDocuments,
};

export default syllabusVersionService;
