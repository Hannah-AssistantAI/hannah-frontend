import { useState, useCallback, useRef } from 'react';
import { VOICE_CONFIG } from '../config/voiceConfig';

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
        .replace(/[🔥💡✅❌⭐🎯📌🚀💻📚🎓]/g, '')  // Common emojis
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

export function useTextToSpeech(): TextToSpeechResult {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback((text: string) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Prepare text for voice (truncate + clean markdown)
        const voiceText = prepareTextForVoice(text);

        // Detect language - if mostly ASCII letters, it's likely English
        const isEnglish = /^[a-zA-Z\s\d.,!?'"-]+$/.test(voiceText.slice(0, 100)) ||
            voiceText.match(/^(Hi|Hello|I'm|I am|How|What|Why|Yes|No|Thank)/i);

        const utterance = new SpeechSynthesisUtterance(voiceText);
        utterance.lang = isEnglish ? 'en-US' : 'vi-VN';

        // 🆕 Optimized settings for clearer Vietnamese
        if (isEnglish) {
            utterance.rate = VOICE_CONFIG.TTS.RATE;
            utterance.pitch = VOICE_CONFIG.TTS.PITCH;
        } else {
            // Vietnamese: slower rate, higher pitch for clarity
            utterance.rate = 0.85;   // Slower = clearer pronunciation
            utterance.pitch = 1.15;  // Slightly higher = more natural
        }
        utterance.volume = VOICE_CONFIG.TTS.VOLUME;

        // Try to find appropriate voice
        const voices = window.speechSynthesis.getVoices();

        if (isEnglish) {
            // Find English voice (preferably US)
            const englishVoice = voices.find(
                (voice) => voice.lang.includes('en-US')
            ) || voices.find(
                (voice) => voice.lang.includes('en')
            );
            if (englishVoice) {
                utterance.voice = englishVoice;
            }
            console.log('[TTS] English voice, rate:', utterance.rate);
        } else {
            // Find Vietnamese voice - prefer Google or "natural" voices
            const vietnameseVoice = voices.find(
                (voice) => voice.lang.includes('vi') && voice.name.includes('Google')
            ) || voices.find(
                (voice) => voice.lang.includes('vi') || voice.lang.includes('VI')
            );
            if (vietnameseVoice) {
                utterance.voice = vietnameseVoice;
                console.log('[TTS] Vietnamese voice:', vietnameseVoice.name);
            }
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
    };
}
