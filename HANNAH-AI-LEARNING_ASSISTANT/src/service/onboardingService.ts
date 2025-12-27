import apiClient from './apiClient';

export interface OnboardingStatus {
    profileCompleted: boolean;
    transcriptUploaded: boolean;
    isOnboardingComplete: boolean;
    onboardingCompletedAt: string | null;
    fullName: string | null;
    studentId: string | null;
    specialization: string | null;
    currentSemester: number | null;
}

export interface CompleteProfileRequest {
    fullName: string;
    studentId: string;
    specializationId: number;
    currentSemester: number;
    phone?: string;
    learningStyle?: string;
}

export interface OnboardingStepResult {
    success: boolean;
    message: string;
    nextStep: 'profile' | 'transcript' | 'complete';
    status?: OnboardingStatus;
}

export const onboardingService = {
    /**
     * Get current onboarding status
     */
    getStatus: async (): Promise<OnboardingStatus> => {
        const response = await apiClient.get<{ success: boolean; data: OnboardingStatus }>('/api/v1/onboarding/status');
        return response.data.data;
    },

    /**
     * Complete profile step (Step 1 of onboarding)
     */
    completeProfile: async (data: CompleteProfileRequest): Promise<OnboardingStepResult> => {
        const response = await apiClient.post<{ success: boolean; data: OnboardingStepResult }>('/api/v1/onboarding/complete-profile', data);
        return response.data.data;
    },

    /**
     * Check if user needs to complete onboarding
     */
    needsOnboarding: async (): Promise<boolean> => {
        try {
            const status = await onboardingService.getStatus();
            return !status.isOnboardingComplete;
        } catch {
            return false; // If error, don't block
        }
    },

    /**
     * Get next step URL based on status
     */
    getNextStepUrl: (status: OnboardingStatus): string => {
        if (!status.profileCompleted) {
            return '/onboarding/profile';
        }
        if (!status.transcriptUploaded) {
            return '/onboarding/transcript';
        }
        return '/onboarding/complete';
    }
};

export default onboardingService;
