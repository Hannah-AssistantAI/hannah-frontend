import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import type { Document } from './documentService';

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
  documents?: Document[];
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
  // Syllabus import fields (JSON strings)
  assessments?: string;
  sessions?: string;
  syllabusMaterials?: string;
  studentTasks?: string;
  // Indicates if subject was updated vs created new
  isUpdated?: boolean;
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
 * @param pageSize - Number of subjects to fetch (default: 1000 to load all)
 * @returns A promise that resolves to a PaginatedSubjects object.
 */
const getAllSubjects = async (pageSize: number = 1000): Promise<PaginatedSubjects> => {
  try {
    const response = await apiClient.get<PaginatedSubjects>(
      `${API_ENDPOINTS.SUBJECT.GET_ALL}?pageSize=${pageSize}`
    );
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
  console.log('=== CREATE SUBJECT REQUEST ===');
  console.log('Endpoint:', API_ENDPOINTS.SUBJECT.CREATE);

  // Convert semester number to enum name for backend
  // Backend uses Semester enum: First=1, Second=2, Third=3, etc.
  const semesterEnumNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'];
  const dataToSend = {
    ...subjectData,
    // Send semester as enum name string if it's a number
    semester: typeof subjectData.semester === 'number'
      ? semesterEnumNames[subjectData.semester - 1] || subjectData.semester
      : subjectData.semester
  };

  console.log('Data being sent:', JSON.stringify(dataToSend, null, 2));
  console.log('==============================');

  try {
    const response = await apiClient.post<Subject>(API_ENDPOINTS.SUBJECT.CREATE, dataToSend);

    console.log('=== CREATE SUBJECT RESPONSE ===');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('===============================');

    return response.data;
  } catch (error: any) {
    console.error('=== CREATE SUBJECT ERROR ===');
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
    console.error('============================');
    throw error;
  }
};

const deleteSubject = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_ENDPOINTS.SUBJECT.GET_ALL}/${id}`);
};

const updateSubject = async (id: number, subjectData: Partial<Subject>): Promise<Subject> => {
  // Convert semester number to enum name for backend
  const semesterEnumNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'];
  const dataToSend = {
    ...subjectData,
    semester: typeof subjectData.semester === 'number'
      ? semesterEnumNames[subjectData.semester - 1] || subjectData.semester
      : subjectData.semester
  };

  const response = await apiClient.put<Subject>(`${API_ENDPOINTS.SUBJECT.GET_ALL}/${id}`, dataToSend);
  return response.data;
};

const subjectService = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  deleteSubject,
  updateSubject,
};

export default subjectService;

