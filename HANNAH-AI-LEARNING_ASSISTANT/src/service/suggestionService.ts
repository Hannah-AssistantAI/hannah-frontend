import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

// Enum for content type
export const SuggestionContentType = {
  LearningOutcome: 1,
  CommonChallenge: 2,
} as const;
export type SuggestionContentType = typeof SuggestionContentType[keyof typeof SuggestionContentType];

// Enum for suggestion status
export const SuggestionStatus = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
} as const;
export type SuggestionStatus = typeof SuggestionStatus[keyof typeof SuggestionStatus];

// Interface for a single suggestion
export interface Suggestion {
  id: number;
  subjectId: number;
  contentType: SuggestionContentType;
  content: string;
  status: SuggestionStatus;
  createdAt: string;
  suggestedByUserId: number;
  suggestedByUserName: string;
  reviewedByUserId?: number | null;
  reviewedByUserName?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

// Interface for creating a suggestion
export interface CreateSuggestionDto {
  subjectId: number;
  contentType: SuggestionContentType;
  content: string;
}

// Interface for approving a suggestion
export interface ApproveSuggestionDto {
  subjectIds: number[];
}

/**
 * Creates a new suggestion.
 * @param suggestionData - The data for the new suggestion.
 * @returns A promise that resolves when the suggestion is created.
 */
const createSuggestion = async (suggestionData: CreateSuggestionDto): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.SUGGESTION.CREATE, suggestionData);
};
// Map string status to number (backend uses JsonStringEnumConverter)
const normalizeStatus = (status: string | number): SuggestionStatus => {
  if (typeof status === 'number') return status as SuggestionStatus;
  const statusMap: { [key: string]: SuggestionStatus } = {
    'Pending': SuggestionStatus.Pending,
    'Approved': SuggestionStatus.Approved,
    'Rejected': SuggestionStatus.Rejected,
  };
  return statusMap[status] || SuggestionStatus.Pending;
};

// Map string contentType to number (backend uses JsonStringEnumConverter)
const normalizeContentType = (contentType: string | number): SuggestionContentType => {
  if (typeof contentType === 'number') return contentType as SuggestionContentType;
  const contentTypeMap: { [key: string]: SuggestionContentType } = {
    'LearningOutcome': SuggestionContentType.LearningOutcome,
    'CommonChallenge': SuggestionContentType.CommonChallenge,
  };
  return contentTypeMap[contentType] || SuggestionContentType.LearningOutcome;
};

/**
 * Fetches suggestions, optionally filtered by status, subjectId, and contentType.
 * @param params - Optional filters including status, subjectId, and contentType.
 * @returns A promise that resolves to an array of suggestions.
 */
const getSuggestions = async (params?: { status?: SuggestionStatus; subjectId?: number; contentType?: SuggestionContentType }): Promise<Suggestion[]> => {
  const response = await apiClient.get<Suggestion[]>(API_ENDPOINTS.SUGGESTION.GET_ALL, params);
  // Normalize status and contentType from string to number (backend uses JsonStringEnumConverter)
  return response.data.map(s => ({
    ...s,
    status: normalizeStatus(s.status as unknown as string | number),
    contentType: normalizeContentType(s.contentType as unknown as string | number)
  }));
};

/**
 * Approves a suggestion and applies it to subjects.
 * @param id - The ID of the suggestion to approve.
 * @param data - The data containing the subject IDs.
 * @returns A promise that resolves when the suggestion is approved.
 */
const approveSuggestion = async (id: number, data: ApproveSuggestionDto): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.SUGGESTION.APPROVE(id.toString()), data);
};

/**
 * Rejects a suggestion.
 * @param id - The ID of the suggestion to reject.
 * @param reason - The reason for rejection.
 * @returns A promise that resolves when the suggestion is rejected.
 */
const rejectSuggestion = async (id: number, reason: string): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.SUGGESTION.REJECT(id.toString()), { reason });
};

/**
 * Deletes a suggestion.
 * @param id - The ID of the suggestion to delete.
 * @returns A promise that resolves when the suggestion is deleted.
 */
const deleteSuggestion = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.SUGGESTION.DELETE(id.toString()));
};

const suggestionService = {
  createSuggestion,
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
  deleteSuggestion,
};

export default suggestionService;

