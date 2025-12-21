/**
 * FPT.AI Text-to-Speech Service
 * High-quality Vietnamese voice synthesis
 * 
 * API: https://api.fpt.ai/hmi/tts/v5
 * Voices: banmai (female), leminh (male), minhquang, lannhi, etc.
 */

// FPT.AI API Key - should be in environment variable in production
const FPT_API_KEY = '6zUn1noE8WJPxhm8AE7qrZwI6aFTBVLX';
const FPT_TTS_ENDPOINT = 'https://api.fpt.ai/hmi/tts/v5';

export interface FptTtsOptions {
    voice?: 'banmai' | 'leminh' | 'minhquang' | 'lannhi' | 'thuminh';
    speed?: number; // -3 to 3, default 0
    format?: 'mp3' | 'wav';
}

export interface FptTtsResponse {
    async: string;  // Async URL to poll for result
    error?: number;
    message?: string;
}

/**
 * Convert text to speech using FPT.AI
 * Returns audio URL that can be played
 */
export async function fptTextToSpeech(
    text: string,
    options: FptTtsOptions = {}
): Promise<string | null> {
    const { voice = 'banmai', speed = 0 } = options;

    try {
        console.log('[FPT.AI TTS] Converting:', text.slice(0, 50) + '...');

        const response = await fetch(FPT_TTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'api-key': FPT_API_KEY,
                'Content-Type': 'application/json',
                'voice': voice,
                'speed': speed.toString(),
            },
            body: text,
        });

        if (!response.ok) {
            console.error('[FPT.AI TTS] API error:', response.status);
            return null;
        }

        const data: FptTtsResponse = await response.json();

        if (data.error) {
            console.error('[FPT.AI TTS] Error:', data.message);
            return null;
        }

        // FPT.AI returns async URL - need to poll or use directly
        // The async URL points to the audio file after processing
        console.log('[FPT.AI TTS] Async URL:', data.async);

        // Wait a bit for processing, then return the URL
        // FPT.AI typically processes within 1-3 seconds for short text
        await new Promise(resolve => setTimeout(resolve, 1500));

        return data.async;
    } catch (error) {
        console.error('[FPT.AI TTS] Error:', error);
        return null;
    }
}

/**
 * Play audio from URL
 */
export function playAudioFromUrl(
    url: string,
    onEnd?: () => void,
    onError?: (error: Error) => void
): HTMLAudioElement {
    const audio = new Audio(url);

    audio.onended = () => {
        console.log('[FPT.AI TTS] Audio playback ended');
        onEnd?.();
    };

    audio.onerror = (e) => {
        console.error('[FPT.AI TTS] Audio playback error:', e);
        onError?.(new Error('Audio playback failed'));
    };

    audio.play().catch(err => {
        console.error('[FPT.AI TTS] Failed to play:', err);
        onError?.(err);
    });

    return audio;
}
