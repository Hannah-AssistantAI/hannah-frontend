/**
 * FPT.AI Text-to-Speech Service
 * Uses backend proxy to bypass CORS issues
 */

// Backend proxy URL
const TTS_PROXY_URL = import.meta.env.VITE_PYTHON_API_URL || 'https://hannahai.online';

/**
 * Convert text to speech using FPT.AI via backend proxy
 * Returns proxied audio URL that can be played without CORS issues
 */
export async function fptTextToSpeech(text: string): Promise<string | null> {
    try {
        console.log('[FPT.AI TTS] Converting via proxy:', text.slice(0, 50) + '...');

        // Get auth token
        const token = localStorage.getItem('access_token');

        const response = await fetch(`${TTS_PROXY_URL}/api/v1/tts/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
                text: text,
                voice: 'banmai'
            }),
        });

        if (!response.ok) {
            console.error('[FPT.AI TTS] Proxy API error:', response.status);
            return null;
        }

        const data = await response.json();
        const audioUrl = data.audio_url;

        if (!audioUrl) {
            console.error('[FPT.AI TTS] No audio URL returned');
            return null;
        }

        console.log('[FPT.AI TTS] Original URL:', audioUrl);

        // Return proxied URL to avoid CORS
        const proxiedUrl = `${TTS_PROXY_URL}/api/v1/tts/proxy?url=${encodeURIComponent(audioUrl)}`;
        console.log('[FPT.AI TTS] Proxied URL:', proxiedUrl);

        return proxiedUrl;
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
    const audio = new Audio();

    audio.onended = () => {
        console.log('[FPT.AI TTS] Audio playback ended');
        onEnd?.();
    };

    audio.onerror = (e) => {
        console.error('[FPT.AI TTS] Audio playback error:', e);
        onError?.(new Error('Audio playback failed'));
    };

    // Add auth header for proxied requests
    const token = localStorage.getItem('access_token');
    if (token && url.includes('/api/v1/tts/proxy')) {
        // For proxied URLs, we need to use fetch + blob approach
        fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                audio.src = blobUrl;
                audio.play().catch(err => {
                    console.error('[FPT.AI TTS] Failed to play:', err);
                    onError?.(err);
                });
            })
            .catch(err => {
                console.error('[FPT.AI TTS] Failed to fetch audio:', err);
                onError?.(err);
            });
    } else {
        // Direct URL
        audio.src = url;
        audio.play().catch(err => {
            console.error('[FPT.AI TTS] Failed to play:', err);
            onError?.(err);
        });
    }

    return audio;
}
