/**
 * FPT.AI Text-to-Speech Service
 * High-quality Vietnamese voice synthesis
 * 
 * API: https://api.fpt.ai/hmi/tts/v5
 * Voice: banmai (female) - ONLY voice used for Hannah
 */

// FPT.AI API Key
const FPT_API_KEY = '6zUn1noE8WJPxhm8AE7qrZwI6aFTBVLX';
const FPT_TTS_ENDPOINT = 'https://api.fpt.ai/hmi/tts/v5';

export interface FptTtsResponse {
    async: string;  // Async URL to the audio file
    error?: number;
    message?: string;
}

/**
 * Convert text to speech using FPT.AI
 * Returns audio URL that can be played
 */
export async function fptTextToSpeech(text: string): Promise<string | null> {
    try {
        console.log('[FPT.AI TTS] Converting:', text.slice(0, 50) + '...');

        const response = await fetch(FPT_TTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'api-key': FPT_API_KEY,
                'Content-Type': 'application/json',
                'voice': 'banmai',  // Female voice - ONLY option
                'speed': '0',
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

        console.log('[FPT.AI TTS] Async URL:', data.async);

        // Wait for FPT.AI to process audio
        // FPT.AI needs time to generate the audio file
        await new Promise(resolve => setTimeout(resolve, 2000));

        return data.async;
    } catch (error) {
        console.error('[FPT.AI TTS] Error:', error);
        return null;
    }
}

/**
 * Play audio from URL
 * NOTE: Do NOT set crossOrigin as FPT.AI doesn't support CORS headers
 */
export function playAudioFromUrl(
    url: string,
    onEnd?: () => void,
    onError?: (error: Error) => void
): HTMLAudioElement {
    const audio = new Audio();

    // DO NOT set crossOrigin - FPT.AI doesn't support CORS
    // audio.crossOrigin = 'anonymous'; // REMOVED - causes CORS error

    audio.onended = () => {
        console.log('[FPT.AI TTS] Audio playback ended');
        onEnd?.();
    };

    audio.onerror = (e) => {
        console.error('[FPT.AI TTS] Audio playback error:', e);
        onError?.(new Error('Audio playback failed'));
    };

    // Set src and play
    audio.src = url;

    audio.play().catch(err => {
        console.error('[FPT.AI TTS] Failed to play:', err);
        onError?.(err);
    });

    return audio;
}
