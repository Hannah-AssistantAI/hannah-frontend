/**
 * FPT.AI Text-to-Speech Service
 * Tries multiple approaches for reliability:
 * 1. Direct FPT.AI (may fail due to CORS)
 * 2. Backend proxy (if deployed)
 * 3. Falls back to browser TTS (handled in useTextToSpeech)
 */

// Backend proxy URL
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'https://hannahai.online';

// FPT.AI Direct API
const FPT_API_KEY = '6zUn1noE8WJPxhm8AE7qrZwI6aFTBVLX';
const FPT_TTS_ENDPOINT = 'https://api.fpt.ai/hmi/tts/v5';

/**
 * Convert text to speech using FPT.AI
 * Tries proxy first, then direct
 */
export async function fptTextToSpeech(text: string): Promise<string | null> {
    const token = localStorage.getItem('access_token');

    // Try 1: Backend proxy (if available)
    try {
        console.log('[FPT.AI TTS] Trying backend proxy...');

        const proxyResponse = await fetch(`${PYTHON_API_URL}/api/v1/tts/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ text, voice: 'banmai' }),
        });

        if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            const audioUrl = data.audio_url;

            if (audioUrl) {
                // Return proxied URL
                const proxiedUrl = `${PYTHON_API_URL}/api/v1/tts/proxy?url=${encodeURIComponent(audioUrl)}`;
                console.log('[FPT.AI TTS] Using proxy URL:', proxiedUrl);
                return proxiedUrl;
            }
        }
        console.log('[FPT.AI TTS] Proxy failed, trying direct...');
    } catch (e) {
        console.log('[FPT.AI TTS] Proxy error:', e);
    }

    // Try 2: Direct FPT.AI API
    try {
        console.log('[FPT.AI TTS] Trying direct FPT.AI API...');

        const response = await fetch(FPT_TTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'api-key': FPT_API_KEY,
                'Content-Type': 'application/json',
                'voice': 'banmai',
                'speed': '0',
            },
            body: text,
        });

        if (!response.ok) {
            console.error('[FPT.AI TTS] Direct API error:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.error) {
            console.error('[FPT.AI TTS] Error:', data.message);
            return null;
        }

        // Wait for audio processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('[FPT.AI TTS] Direct URL:', data.async);
        return data.async;  // May fail due to CORS
    } catch (error) {
        console.error('[FPT.AI TTS] Direct error:', error);
        return null;
    }
}

/**
 * Play audio from URL
 * Handles both direct and proxied URLs
 */
export function playAudioFromUrl(
    url: string,
    onEnd?: () => void,
    onError?: (error: Error) => void,
    onPlay?: () => void  // 🆕 Callback when audio actually starts
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

    // 🆕 onplay event - audio actually started!
    audio.onplay = () => {
        console.log('[FPT.AI TTS] Audio started');
        onPlay?.();
    };

    const token = localStorage.getItem('access_token');

    // For proxied URLs, fetch with auth header
    if (url.includes('/api/v1/tts/proxy')) {
        console.log('[FPT.AI TTS] Playing via proxy...');

        fetch(url, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Proxy returned ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                audio.src = blobUrl;
                audio.play().catch(err => {
                    console.error('[FPT.AI TTS] Failed to play blob:', err);
                    onError?.(err);
                });
            })
            .catch(err => {
                console.error('[FPT.AI TTS] Proxy fetch failed:', err);
                onError?.(err);
            });
    } else {
        // Direct URL - just try to play
        console.log('[FPT.AI TTS] Playing direct URL...');
        audio.src = url;
        audio.play().catch(err => {
            console.error('[FPT.AI TTS] Failed to play direct:', err);
            onError?.(err);
        });
    }

    return audio;
}
