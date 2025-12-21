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
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            // Don't show error for no-speech - just let user try again
            if (event.error === 'no-speech') {
                console.log('No speech detected - waiting for user to speak');
                // Don't set error, just continue listening or let it timeout gracefully
                return;
            }
            if (event.error === 'aborted') {
                // User cancelled, not an error
                return;
            }
            setError(`Lỗi nhận diện giọng nói: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setError(null);
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error('Failed to start recognition:', err);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        transcript,
        isListening,
        error,
        startListening,
        stopListening,
    };
}
