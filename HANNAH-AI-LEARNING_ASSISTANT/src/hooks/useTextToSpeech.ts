import { useState, useCallback, useRef } from 'react';

interface TextToSpeechResult {
    speak: (text: string) => void;
    stop: () => void;
    isSpeaking: boolean;
}

export function useTextToSpeech(): TextToSpeechResult {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback((text: string) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Detect language - if mostly ASCII letters, it's likely English
        const isEnglish = /^[a-zA-Z\s\d.,!?'"-]+$/.test(text.slice(0, 100)) ||
            text.match(/^(Hi|Hello|I'm|I am|How|What|Why|Yes|No|Thank)/i);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isEnglish ? 'en-US' : 'vi-VN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

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
            console.log('[TTS] Using English voice for:', text.slice(0, 50));
        } else {
            // Find Vietnamese voice
            const vietnameseVoice = voices.find(
                (voice) => voice.lang.includes('vi') || voice.lang.includes('VI')
            );
            if (vietnameseVoice) {
                utterance.voice = vietnameseVoice;
            }
            console.log('[TTS] Using Vietnamese voice for:', text.slice(0, 50));
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
