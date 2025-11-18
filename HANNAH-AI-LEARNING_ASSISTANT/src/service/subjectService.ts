import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

// Interface for a single Subject
export type Subject = {
  subjectId: number;
  code: string;
  name: string;
  credits: number;
  semester: number;
  isActive: boolean;
  createdAt: string;
  description?: string;
  estimatedHours?: number;
  prerequisites?: string[];
  learningOutcomes?: string[];
  commonChallenges?: string[];
  createdBy?: number;
  updatedAt?: string | null;
  degreeLevel?: string;
  timeAllocation?: string;
  tools?: string;
  scoringScale?: string;
  isApproved?: boolean;
  decisionNo?: string;
  minAvgMarkToPass?: number;
  approvedDate?: string | null;
}

// Interface for the paginated response of subjects
export type PaginatedSubjects = {
  items: Subject[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Fetches a list of all subjects.
 * @returns A promise that resolves to a PaginatedSubjects object.
 */
const getAllSubjects = async (): Promise<PaginatedSubjects> => {
  try {
    const response = await apiClient.get<PaginatedSubjects>(API_ENDPOINTS.SUBJECT.GET_ALL);
    return response.data;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
};

const getSubjectById = async (id: number): Promise<Subject> => {
  const response = await apiClient.get<Subject>(`${API_ENDPOINTS.SUBJECT.GET_ALL}/${id}`);
  return response.data;
};


const createSubject = async (subjectData: Partial<Subject>): Promise<Subject> => {
  const response = await apiClient.post<Subject>(API_ENDPOINTS.SUBJECT.CREATE, subjectData);
  return response.data;
};

const subjectService = {
  getAllSubjects,
  getSubjectById,
  createSubject,
};

export default subjectService;

