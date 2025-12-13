/**
 * Admin Service
 * Service for admin API calls including AI Settings management
 */

import apiClient from './apiClient';

// Types
export interface SystemSetting {
    id: number;
    settingKey: string;
    settingValue: string;
    settingType: string;
    category: string | null;
    description: string | null;
    isPublic: boolean;
    updatedBy: number | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface UpdateSettingRequest {
    value: string;
}

// AI Prompt specific types
export type AiSettingKey =
    | 'ai_system_prompt'
    | 'ai_student_context_template'
    | 'ai_student_context_enabled'
    | 'ai_citation_format'
    | 'ai_citation_enabled'
    | 'ai_citation_instruction'
    | 'ai_rag_semester_filter_enabled'
    | 'ai_rag_specialization_filter_enabled'
    | 'ai_specialization_start_semester'
    | 'ai_response_guidelines';

const AI_SETTINGS_CATEGORY = 'ai_prompt';

const adminService = {
    /**
     * Get all system settings, optionally filtered by category
     */
    getSettings: async (category?: string): Promise<SystemSetting[]> => {
        const params = category ? { category } : undefined;
        const response = await apiClient.get<{ success: boolean; data: SystemSetting[] }>(
            '/api/v1/admin/settings',
            params
        );
        return response.data.data;
    },

    /**
     * Get all AI prompt settings
     */
    getAiSettings: async (): Promise<SystemSetting[]> => {
        return adminService.getSettings(AI_SETTINGS_CATEGORY);
    },

    /**
     * Get a single setting by key
     */
    getSettingByKey: async (key: string): Promise<SystemSetting | null> => {
        try {
            const response = await apiClient.get<{ success: boolean; data: SystemSetting }>(
                `/api/v1/admin/settings/${key}`
            );
            return response.data.data;
        } catch (error) {
            console.error(`Failed to get setting ${key}:`, error);
            return null;
        }
    },

    /**
     * Update a setting value
     */
    updateSetting: async (key: string, value: string): Promise<SystemSetting> => {
        const response = await apiClient.put<{ success: boolean; data: SystemSetting }>(
            `/api/v1/admin/settings/${key}`,
            { key, settingValue: value }
        );
        return response.data.data;
    },

    /**
     * Helper: Get setting value by key
     */
    getAiSettingValue: async (key: AiSettingKey): Promise<string | null> => {
        const setting = await adminService.getSettingByKey(key);
        return setting?.settingValue ?? null;
    },

    /**
     * Helper: Update AI setting
     */
    updateAiSetting: async (key: AiSettingKey, value: string): Promise<SystemSetting> => {
        return adminService.updateSetting(key, value);
    },

    /**
     * Helper: Get boolean setting
     */
    getBooleanSetting: async (key: AiSettingKey): Promise<boolean> => {
        const value = await adminService.getAiSettingValue(key);
        return value?.toLowerCase() === 'true';
    },

    /**
     * Helper: Set boolean setting
     */
    setBooleanSetting: async (key: AiSettingKey, value: boolean): Promise<SystemSetting> => {
        return adminService.updateSetting(key, value.toString());
    },
};

export default adminService;
