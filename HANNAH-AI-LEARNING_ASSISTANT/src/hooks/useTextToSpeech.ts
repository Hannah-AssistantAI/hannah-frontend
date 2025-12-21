import { useState, useCallback, useRef } from 'react';
import { VOICE_CONFIG } from '../config/voiceConfig';
import { fptTextToSpeech, playAudioFromUrl } from '../service/fptTtsService';

interface TextToSpeechResult {
    speak: (text: string) => void;
    stop: () => void;
    isSpeaking: boolean;
}

/**
 * Prepare text for voice output:
 * - Remove ALL markdown formatting
 * - Remove emojis and special symbols
 * - Truncate long responses
 * - Clean up for natural speech
 */
function prepareTextForVoice(text: string, maxLength: number = 400): string {
    let cleaned = text
        // Remove markdown formatting
        .replace(/#{1,6}\s/g, '')               // Headers
        .replace(/\*\*([^*]+)\*\*/g, '$1')      // Bold **text**
        .replace(/\*([^*]+)\*/g, '$1')          // Italic *text*
        .replace(/__([^_]+)__/g, '$1')          // Bold __text__
        .replace(/_([^_]+)_/g, '$1')            // Italic _text_
        .replace(/`{3}[\s\S]*?`{3}/g, '')       // Code blocks ```code```
        .replace(/`([^`]+)`/g, '$1')            // Inline code `code`
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links [text](url)
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')   // Images ![alt](url)

        // Remove special symbols that TTS reads literally
        .replace(/[*+•→←↑↓◆◇○●■□▪▫]/g, '')     // Bullets and arrows
        .replace(/[🔥💡✅❌⭐🎯📌🚀💻📚🎓🎤]/g, '')  // Common emojis
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport symbols
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats

        // Clean up structure
        .replace(/\n{2,}/g, '. ')               // Multiple newlines → pause
        .replace(/\n/g, ' ')                    // Single newlines → space
        .replace(/[-–—]/g, ', ')                // Dashes → comma pause
        .replace(/[:;]/g, ', ')                 // Colons/semicolons → comma
        .replace(/\s{2,}/g, ' ')                // Multiple spaces → single
        .replace(/\(\)/g, '')                   // Empty parentheses
        .replace(/\[\]/g, '')                   // Empty brackets
        .trim();

    // Truncate if too long (shorter for voice)
    if (cleaned.length > maxLength) {
        const truncated = cleaned.slice(0, maxLength);
        const lastSentence = truncated.lastIndexOf('.');
        if (lastSentence > maxLength * 0.6) {
            cleaned = truncated.slice(0, lastSentence + 1);
        } else {
            cleaned = truncated.trim();
        }
    }

    return cleaned;
}

/**
 * Detect if text is English or Vietnamese
 */
function detectLanguage(text: string): 'en' | 'vi' {
    const sample = text.slice(0, 100);
    const isEnglish = /^[a-zA-Z\s\d.,!?'"-]+$/.test(sample) ||
        /^(Hi|Hello|I'm|I am|How|What|Why|Yes|No|Thank|The|This|That|It|Is)/i.test(sample);
    return isEnglish ? 'en' : 'vi';
}

export function useTextToSpeech(): TextToSpeechResult {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Browser TTS with proper state management
    const speakWithBrowserTTS = useCallback((text: string, lang: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        if (lang === 'en-US') {
            utterance.rate = VOICE_CONFIG.TTS.RATE;
            utterance.pitch = VOICE_CONFIG.TTS.PITCH;
        } else {
            utterance.rate = 0.85;
            utterance.pitch = 1.15;
        }
        utterance.volume = VOICE_CONFIG.TTS.VOLUME;

        // Find FEMALE voice for Hannah
        const voices = window.speechSynthesis.getVoices();
        if (lang === 'en-US') {
            const femaleVoiceKeywords = [
                'female', 'samantha', 'karen', 'victoria', 'fiona',
                'moira', 'tessa', 'zira', 'hazel', 'susan', 'heera', 'jenny',
            ];
            const femaleVoice = voices.find(v =>
                v.lang.includes('en') &&
                femaleVoiceKeywords.some(kw => v.name.toLowerCase().includes(kw))
            ) || voices.find(v => v.lang.startsWith('en-'));
            if (femaleVoice) {
                utterance.voice = femaleVoice;
                console.log('[TTS] Using female English voice:', femaleVoice.name);
            }
        } else {
            const matchingVoice = voices.find(v => v.lang.includes(lang.split('-')[0]));
            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }
        }

        // 🆕 CRITICAL: Set isSpeaking BEFORE speaking starts
        setIsSpeaking(true);

        utterance.onend = () => {
            console.log('[TTS] Browser TTS ended');
            setIsSpeaking(false);
        };
        utterance.onerror = (e) => {
            console.error('[TTS] Browser TTS error:', e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    const speak = useCallback(async (text: string) => {
        console.log('[TTS] speak() called');

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Prepare text for voice
        const voiceText = prepareTextForVoice(text);
        const language = detectLanguage(voiceText);

        console.log(`[TTS] Language: ${language}, text: "${voiceText.slice(0, 50)}..."`);

        // 🆕 DON'T set isSpeaking here - wait until audio actually plays

        if (language === 'vi') {
            // Try FPT.AI for Vietnamese (better voice quality)
            console.log('[TTS] Using FPT.AI for Vietnamese');

            try {
                const audioUrl = await fptTextToSpeech(voiceText);

                if (audioUrl) {
                    console.log('[TTS] FPT.AI audio URL ready, playing...');
                    audioRef.current = playAudioFromUrl(
                        audioUrl,
                        () => {
                            console.log('[TTS] FPT.AI audio ended');
                            setIsSpeaking(false);
                        },
                        (error) => {
                            console.error('[TTS] FPT.AI playback failed:', error);
                            // Fallback to browser TTS
                            speakWithBrowserTTS(voiceText, 'vi-VN');
                        },
                        () => {
                            // 🆕 onPlay callback - audio actually started!
                            console.log('[TTS] FPT.AI audio started playing');
                            setIsSpeaking(true);
                        }
                    );
                } else {
                    console.log('[TTS] FPT.AI returned null, using browser TTS');
                    speakWithBrowserTTS(voiceText, 'vi-VN');
                }
            } catch (error) {
                console.error('[TTS] FPT.AI error:', error);
                speakWithBrowserTTS(voiceText, 'vi-VN');
            }
        } else {
            // English - use browser TTS
            console.log('[TTS] Using browser TTS for English');
            speakWithBrowserTTS(voiceText, 'en-US');
        }
    }, [speakWithBrowserTTS]);

    const stop = useCallback(() => {
        console.log('[TTS] stop() called');
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsSpeaking(false);
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
    };
}
