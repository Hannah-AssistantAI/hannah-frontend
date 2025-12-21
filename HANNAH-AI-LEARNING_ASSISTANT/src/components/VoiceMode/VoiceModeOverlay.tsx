import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { X, Mic, MicOff, Volume2 } from 'lucide-react';
import { Experience } from './Experience';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { chatService } from '../../service/chatService';
import { VOICE_CONFIG, type VoiceStatus } from '../../config/voiceConfig';
import './VoiceModeOverlay.css';

interface VoiceModeOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceModeOverlay({ isOpen, onClose }: VoiceModeOverlayProps) {
    const [status, setStatus] = useState<VoiceStatus>('idle');
    const [displayText, setDisplayText] = useState('');
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

    const { transcript, isListening, startListening, stopListening, error } = useSpeechRecognition();
    const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

    // Handle transcript updates
    useEffect(() => {
        if (transcript) {
            setDisplayText(transcript);
        }
    }, [transcript]);

    // Update status based on listening/speaking states
    useEffect(() => {
        if (isListening) {
            setStatus('listening');
        } else if (isSpeaking) {
            setStatus('speaking');
            setIsAvatarSpeaking(true);
        } else if (status === 'speaking' && !isSpeaking) {
            setStatus('idle');
            setIsAvatarSpeaking(false);
        }
    }, [isListening, isSpeaking, status]);

    // Handle sending message when user stops speaking
    const handleSendVoiceMessage = useCallback(async () => {
        console.log('[VoiceMode] handleSendVoiceMessage called, transcript:', transcript);
        if (!transcript.trim()) {
            console.log('[VoiceMode] No transcript, skipping');
            return;
        }

        setStatus('processing');
        setDisplayText('Đang xử lý...');

        try {
            console.log('[VoiceMode] Calling chatService.sendVoiceMessage...');
            // Send message to backend (ephemeral - no conversation saving)
            const response = await chatService.sendVoiceMessage(transcript);
            console.log('[VoiceMode] Response:', response);

            if (response) {
                setDisplayText(response);
                setStatus('speaking');
                speak(response);
            } else {
                setDisplayText('Không nhận được phản hồi từ Hannah');
                setStatus('idle');
            }
        } catch (err) {
            console.error('[VoiceMode] Voice message error:', err);
            setDisplayText('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.');
            setStatus('idle');
        }
    }, [transcript, speak]);

    // Auto-send after 2 seconds of silence when transcript is available
    useEffect(() => {
        if (isListening && transcript.trim()) {
            const timer = setTimeout(() => {
                console.log('[VoiceMode] Auto-sending after silence...');
                stopListening();
                setTimeout(() => handleSendVoiceMessage(), VOICE_CONFIG.SPEECH.PROCESSING_DELAY_MS);
            }, VOICE_CONFIG.SPEECH.SILENCE_TIMEOUT_MS);
            return () => clearTimeout(timer);
        }
    }, [transcript, isListening, stopListening, handleSendVoiceMessage]);

    // Handle mic button click
    const handleMicClick = useCallback(() => {
        console.log('[VoiceMode] Mic clicked, isListening:', isListening, 'isSpeaking:', isSpeaking);
        if (isListening) {
            stopListening();
            // Wait a bit then send message
            setTimeout(() => {
                handleSendVoiceMessage();
            }, 500);
        } else if (isSpeaking) {
            stopSpeaking();
            setIsAvatarSpeaking(false);
            setStatus('idle');
        } else {
            setDisplayText('');
            startListening();
        }
    }, [isListening, isSpeaking, startListening, stopListening, stopSpeaking, handleSendVoiceMessage]);

    // Handle audio end from avatar
    const handleAudioEnd = useCallback(() => {
        setIsAvatarSpeaking(false);
        setStatus('idle');
    }, []);

    // Get status text
    const getStatusText = () => {
        switch (status) {
            case 'listening':
                return '🎤 Đang nghe... (nhấn mic hoặc đợi 2s để gửi)';
            case 'processing':
                return '⏳ Đang xử lý...';
            case 'speaking':
                return '🔊 Hannah đang nói...';
            default:
                return 'Nhấn nút mic để bắt đầu';
        }
    };

    // Get button icon
    const getMicIcon = () => {
        if (isListening) return <MicOff />;
        if (isSpeaking) return <Volume2 />;
        return <Mic />;
    };

    if (!isOpen) return null;

    return (
        <div className="voice-mode-overlay">
            {/* Header */}
            <div className="voice-mode-header">
                <h2 className="voice-mode-title">Hannah AI</h2>
                <span className="voice-mode-badge">Voice Mode</span>
            </div>

            {/* Close button */}
            <button className="voice-mode-close-btn" onClick={onClose}>
                <X size={24} />
            </button>

            {/* 3D Canvas */}
            <div className="voice-mode-canvas-container">
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
                    <color attach="background" args={['#1a1a2e']} />
                    <Experience
                        isPlaying={isAvatarSpeaking}
                        onAudioEnd={handleAudioEnd}
                    />
                </Canvas>
            </div>

            {/* Controls */}
            <div className="voice-mode-controls">
                <p className={`voice-mode-status ${status}`}>
                    {getStatusText()}
                </p>

                {displayText && (
                    <p className="voice-mode-transcript">
                        {displayText}
                    </p>
                )}

                {error && (
                    <p className="voice-mode-transcript" style={{ color: '#ef4444' }}>
                        {error}
                    </p>
                )}

                <button
                    className={`voice-mode-mic-btn ${status}`}
                    onClick={handleMicClick}
                    disabled={status === 'processing'}
                >
                    {getMicIcon()}
                </button>

                <p className="voice-mode-hint">
                    {isListening ? 'Nhấn lại để gửi' : 'Nhấn để nói chuyện với Hannah'}
                </p>
            </div>
        </div>
    );
}
