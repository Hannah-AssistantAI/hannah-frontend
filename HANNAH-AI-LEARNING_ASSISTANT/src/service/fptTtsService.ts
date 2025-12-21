/**
 * FPT.AI Text-to-Speech Service
 * Uses backend to synthesize and return audio as base64 data URL
 */

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'https://hannahai.online';

/**
 * Convert text to speech using FPT.AI via backend
 * Returns base64 audio data URL ready to play
 */
export async function fptTextToSpeech(text: string): Promise<string | null> {
    const token = localStorage.getItem('access_token');

    try {
        console.log('[FPT.AI TTS] Calling backend synthesize...');

        const response = await fetch(`${PYTHON_API_URL}/api/v1/tts/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ text, voice: 'banmai' }),
        });

        if (!response.ok) {
            console.error('[FPT.AI TTS] Backend error:', response.status);
            return null;
        }

        const data = await response.json();

        // 🆕 Backend returns base64 audio data
        if (data.audio_data) {
            console.log('[FPT.AI TTS] Got base64 audio data');
            return data.audio_data;  // data:audio/mpeg;base64,...
        }

        // Fallback: URL (may have CORS issues)
        if (data.audio_url) {
            console.log('[FPT.AI TTS] Got audio URL (fallback):', data.audio_url);
            return data.audio_url;
        }

        return null;
    } catch (error) {
        console.error('[FPT.AI TTS] Error:', error);
        return null;
    }
}

/**
 * Play audio from URL or data URL
 */
export function playAudioFromUrl(
    url: string,
    onEnd?: () => void,
    onError?: (error: Error) => void,
    onPlay?: () => void
): HTMLAudioElement {
    const audio = new Audio();

    audio.onended = () => {
        console.log('[FPT.AI TTS] Audio ended');
        onEnd?.();
    };

    audio.onerror = (e) => {
        console.error('[FPT.AI TTS] Audio error:', e);
        onError?.(new Error('Audio playback failed'));
    };

    audio.onplay = () => {
        console.log('[FPT.AI TTS] Audio started');
        onPlay?.();
    };

    // 🆕 For data URLs (base64), play directly
    if (url.startsWith('data:audio')) {
        console.log('[FPT.AI TTS] Playing base64 audio...');
        audio.src = url;
        audio.play().catch(err => {
            console.error('[FPT.AI TTS] Failed to play:', err);
            onError?.(err);
        });
    } else {
        // Regular URL
        console.log('[FPT.AI TTS] Playing URL...');
        audio.src = url;
        audio.play().catch(err => {
            console.error('[FPT.AI TTS] Failed to play:', err);
            onError?.(err);
        });
    }

    return audio;
}
