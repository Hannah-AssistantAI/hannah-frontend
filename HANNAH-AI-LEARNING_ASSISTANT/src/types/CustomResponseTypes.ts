export interface CustomResponse {
    responseId: string;
    subjectId: number | null;
    createdBy: number;
    triggerKeywords: string[];
    questionPattern: string | null;
    responseContent: string;
    isActive: boolean;
    usageCount: number;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomResponseRequest {
    subjectId: number | null;
    triggerKeywords: string[];
    questionPattern?: string;
    responseContent: string;
    isActive: boolean;
}

export interface UpdateCustomResponseRequest {
    triggerKeywords?: string[];
    questionPattern?: string;
    responseContent?: string;
    isActive?: boolean;
}

export interface CustomResponseListResponse {
    items: CustomResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MatchCustomResponseRequest {
    query: string;
    subjectId?: number;
}

export interface MatchCustomResponseResponse {
    matched: boolean;
    response: CustomResponse | null;
}

export interface SimilarResponseItem {
    response: CustomResponse;
    similarityScore: number;
}

export interface SimilarityCheckResponse {
    items: SimilarResponseItem[];
}
