import apiClient from './apiClient';

// Interface for a single Specialization
export type Specialization = {
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
};

// Interface for a subject in a specialization
export type SpecializationSubject = {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    credits?: number;
    semester: number;
    subjectType: string;  // required, elective, recommended
    semesterRecommended?: number;
    notes?: string;
};

// Request to add a subject to a specialization
export type AddSubjectRequest = {
    subjectId: number;
    subjectType?: string;  // required, elective, recommended
    semesterRecommended?: number;
    notes?: string;
};

/**
 * Fetches all specializations.
 */
const getAllSpecializations = async (includeInactive: boolean = false): Promise<Specialization[]> => {
    const response = await apiClient.get<Specialization[]>(
        `/api/specializations?includeInactive=${includeInactive}`
    );
    return response.data;
};

/**
 * Fetches subjects linked to a specialization.
 */
const getSpecializationSubjects = async (specializationId: number): Promise<SpecializationSubject[]> => {
    const response = await apiClient.get<SpecializationSubject[]>(
        `/api/specializations/${specializationId}/subjects`
    );
    return response.data;
};

/**
 * Adds a subject to a specialization.
 */
const addSubjectToSpecialization = async (
    specializationId: number,
    request: AddSubjectRequest
): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
        `/api/specializations/${specializationId}/subjects`,
        request
    );
    return response.data;
};

/**
 * Removes a subject from a specialization.
 */
const removeSubjectFromSpecialization = async (
    specializationId: number,
    subjectId: number
): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/api/specializations/${specializationId}/subjects/${subjectId}`
    );
    return response.data;
};

/**
 * Creates a new specialization.
 */
const createSpecialization = async (
    data: Omit<Specialization, 'id' | 'totalSubjects' | 'requiredSubjects' | 'electiveSubjects'>
): Promise<{ success: boolean; id: number; message: string }> => {
    const response = await apiClient.post<{ success: boolean; id: number; message: string }>(
        '/api/specializations',
        data
    );
    return response.data;
};

/**
 * Updates an existing specialization.
 */
const updateSpecialization = async (
    id: number,
    data: Partial<Specialization>
): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>(
        `/api/specializations/${id}`,
        data
    );
    return response.data;
};

/**
 * Deletes a specialization.
 */
const deleteSpecialization = async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/api/specializations/${id}`
    );
    return response.data;
};

const specializationService = {
    getAllSpecializations,
    getSpecializationSubjects,
    addSubjectToSpecialization,
    removeSubjectFromSpecialization,
    createSpecialization,
    updateSpecialization,
    deleteSpecialization,
};

export default specializationService;
