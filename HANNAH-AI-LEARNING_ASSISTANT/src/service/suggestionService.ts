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
  contentType: SuggestionContentType;
  content: string;
  status: SuggestionStatus;
  createdAt: string;
  suggestedByUserId: number;
  suggestedByUserName: string;
  reviewedByUserId?: number | null;
  reviewedByUserName?: string | null;
  reviewedAt?: string | null;
}

// Interface for creating a suggestion
export interface CreateSuggestionDto {
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

/**
 * Fetches suggestions, optionally filtered by status.
 * @param status - The status to filter by.
 * @returns A promise that resolves to an array of suggestions.
 */
const getSuggestions = async (params?: { status?: SuggestionStatus; subjectId?: number; contentType?: SuggestionContentType }): Promise<Suggestion[]> => {
  const response = await apiClient.get<Suggestion[]>(API_ENDPOINTS.SUGGESTION.GET_ALL, params);
  return response.data;
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
 * @returns A promise that resolves when the suggestion is rejected.
 */
const rejectSuggestion = async (id: number): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.SUGGESTION.REJECT(id.toString()));
};

const suggestionService = {
  createSuggestion,
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
};

export default suggestionService;

