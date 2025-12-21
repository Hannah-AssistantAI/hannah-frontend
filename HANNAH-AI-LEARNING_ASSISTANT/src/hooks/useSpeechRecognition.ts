import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionResult {
    transcript: string;
    isListening: boolean;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
}

// Extend Window interface for webkit speech recognition
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

declare const window: IWindow;

export function useSpeechRecognition(): SpeechRecognitionResult {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);
    // 🆕 Accumulate all final transcripts across multiple speech segments
    const accumulatedTranscriptRef = useRef('');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Trình duyệt không hỗ trợ nhận diện giọng nói');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening until manually stopped
        recognition.interimResults = true;
        recognition.lang = 'vi-VN'; // Vietnamese language
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            let newFinalTranscript = '';
            let interimTranscript = '';

            // 🆕 Only process new results from resultIndex onwards
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    newFinalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            // 🆕 Accumulate final transcripts (don't reset on pauses)
            if (newFinalTranscript) {
                accumulatedTranscriptRef.current += ' ' + newFinalTranscript;
                accumulatedTranscriptRef.current = accumulatedTranscriptRef.current.trim();
            }

            // 🆕 Display accumulated + current interim
            const displayText = accumulatedTranscriptRef.current +
                (interimTranscript ? ' ' + interimTranscript : '');
            setTranscript(displayText.trim());
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                console.log('No speech detected - waiting for user to speak');
                return;
            }
            if (event.error === 'aborted') {
                return;
            }
            setError(`Lỗi nhận diện giọng nói: ${event.error}`);
            setIsListening(false);
            isListeningRef.current = false;
        };

        recognition.onend = () => {
            setIsListening(false);
            isListeningRef.current = false;
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // Ignore abort errors
                }
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListeningRef.current) {
            // 🆕 Reset accumulated transcript when starting fresh
            accumulatedTranscriptRef.current = '';
            setTranscript('');
            setError(null);
            try {
                recognitionRef.current.start();
                setIsListening(true);
                isListeningRef.current = true;
            } catch (err: any) {
                if (err.name === 'InvalidStateError') {
                    console.log('Recognition already running, ignoring start request');
                } else {
                    console.error('Failed to start recognition:', err);
                }
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListeningRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // Ignore stop errors
            }
            setIsListening(false);
            isListeningRef.current = false;
        }
    }, []);

    return {
        transcript,
        isListening,
        error,
        startListening,
        stopListening,
    };
}
