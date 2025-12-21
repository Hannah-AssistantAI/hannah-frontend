/**
 * Voice Mode Configuration
 * 
 * Centralized configuration for voice-related features.
 * Avoids hardcoded values scattered throughout the codebase.
 */

export const VOICE_CONFIG = {
    // Speech Recognition
    SPEECH: {
        /** Default language for speech recognition */
        DEFAULT_LANGUAGE: 'vi-VN',
        /** Supported languages */
        LANGUAGES: {
            VIETNAMESE: 'vi-VN',
            ENGLISH: 'en-US',
        } as const,
        /** Timeout (ms) before auto-sending after silence */
        SILENCE_TIMEOUT_MS: 2000,
        /** Delay (ms) before processing after mic stop */
        PROCESSING_DELAY_MS: 300,
    },

    // Text-to-Speech
    TTS: {
        /** Speech rate (0.1 to 10) */
        RATE: 1.0,
        /** Speech pitch (0 to 2) */
        PITCH: 1.0,
        /** Volume (0 to 1) */
        VOLUME: 1.0,
    },

    // 3D Avatar
    AVATAR: {
        /** Path to 3D model - Female Hannah avatar */
        MODEL_PATH: '/models/hannah-female.glb',
        /** Animation paths */
        ANIMATIONS: {
            IDLE: '/animations/Idle.fbx',
            GREETING: '/animations/Standing Greeting.fbx',
        },
        /** Animation fade duration (seconds) */
        ANIMATION_FADE_DURATION: 0.5,
    },

    // UI
    UI: {
        /** Status messages */
        STATUS_MESSAGES: {
            IDLE: 'Nhấn nút mic để bắt đầu',
            LISTENING: '🎤 Đang nghe... (nhấn mic hoặc đợi 2s để gửi)',
            PROCESSING: '⏳ Đang xử lý...',
            SPEAKING: '🔊 Hannah đang nói...',
        } as const,
    },
} as const;

/** Voice status type */
export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

/** Supported language codes */
export type VoiceLanguage = typeof VOICE_CONFIG.SPEECH.LANGUAGES[keyof typeof VOICE_CONFIG.SPEECH.LANGUAGES];
