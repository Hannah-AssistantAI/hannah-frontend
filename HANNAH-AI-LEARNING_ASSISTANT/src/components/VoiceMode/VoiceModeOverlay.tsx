import { useState, useCallback, useEffect, useRef } from 'react';
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

// 🆕 Waveform Visualizer Component
function WaveformVisualizer({ status }: { status: VoiceStatus }) {
    if (status === 'idle' || status === 'processing') return null;

    return (
        <div className={`voice-waveform ${status}`}>
            {[...Array(10)].map((_, i) => (
                <div key={i} className="voice-waveform-bar" />
            ))}
        </div>
    );
}

// 🆕 Typewriter Text Component
function TypewriterText({ text, isActive }: { text: string; isActive: boolean }) {
    const [displayText, setDisplayText] = useState('');
    const indexRef = useRef(0);

    useEffect(() => {
        if (!isActive || !text) {
            setDisplayText(text);
            indexRef.current = text.length;
            return;
        }

        // Reset and start typewriter
        setDisplayText('');
        indexRef.current = 0;

        const interval = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayText(text.slice(0, indexRef.current + 1));
                indexRef.current++;
            } else {
                clearInterval(interval);
            }
        }, 30); // 30ms per character

        return () => clearInterval(interval);
    }, [text, isActive]);

    return (
        <>
            {displayText}
            {isActive && indexRef.current < text.length && (
                <span className="typewriter-cursor" />
            )}
        </>
    );
}

// 🆕 Floating Particles Background
function ParticlesBackground() {
    return (
        <div className="voice-mode-particles">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="particle" />
            ))}
        </div>
    );
}

export function VoiceModeOverlay({ isOpen, onClose }: VoiceModeOverlayProps) {
    const [status, setStatus] = useState<VoiceStatus>('idle');
    const [displayText, setDisplayText] = useState('');
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
    const [showTypewriter, setShowTypewriter] = useState(false);

    const { transcript, isListening, startListening, stopListening, error } = useSpeechRecognition();
    const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

    // 🆕 CRITICAL: Stop all audio when Voice Mode closes
    useEffect(() => {
        if (!isOpen) {
            stopSpeaking();
            stopListening();
            window.speechSynthesis.cancel();
            setDisplayText('');
            setStatus('idle');
        }
    }, [isOpen, stopSpeaking, stopListening]);

    // Handle transcript updates
    useEffect(() => {
        if (transcript) {
            setDisplayText(transcript);
            setShowTypewriter(false);
        }
    }, [transcript]);

    // Update status based on listening/speaking states
    useEffect(() => {
        if (isListening) {
            setStatus('listening');
            setIsAvatarSpeaking(false);
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
        setShowTypewriter(false);

        try {
            console.log('[VoiceMode] Calling chatService.sendVoiceMessage...');
            const response = await chatService.sendVoiceMessage(transcript);
            console.log('[VoiceMode] Response:', response);

            if (response) {
                setDisplayText(response);
                setShowTypewriter(true); // 🆕 Enable typewriter for response
                setStatus('speaking');
                speak(response);
            } else {
                setDisplayText('Không nhận được phản hồi từ Hannah');
                setStatus('idle');
            }
        } catch (err) {
            console.error('[VoiceMode] Voice message error:', err);
            setDisplayText('Đã xảy ra lỗi. Vui lòng thử lại.');
            setStatus('idle');
        }
    }, [transcript, speak]);

    // Auto-send after silence
    useEffect(() => {
        if (!isListening && transcript.trim() && status === 'listening') {
            console.log('[VoiceMode] Auto-sending after silence...');
            const timer = setTimeout(() => {
                handleSendVoiceMessage();
            }, VOICE_CONFIG.SPEECH.SILENCE_TIMEOUT_MS);
            return () => clearTimeout(timer);
        }
    }, [isListening, transcript, status, handleSendVoiceMessage]);

    // Handle mic button click
    const handleMicClick = useCallback(() => {
        console.log('[VoiceMode] Mic clicked, isListening:', isListening, 'isSpeaking:', isSpeaking);

        if (isSpeaking) {
            stopSpeaking();
            setStatus('idle');
            return;
        }

        if (isListening) {
            stopListening();
            if (transcript.trim()) {
                handleSendVoiceMessage();
            } else {
                setStatus('idle');
            }
        } else {
            setDisplayText('');
            startListening();
        }
    }, [isListening, isSpeaking, transcript, startListening, stopListening, stopSpeaking, handleSendVoiceMessage]);

    const handleAudioEnd = useCallback(() => {
        setIsAvatarSpeaking(false);
        setStatus('idle');
        setShowTypewriter(false);
    }, []);

    const handleClose = useCallback(() => {
        stopSpeaking();
        stopListening();
        setStatus('idle');
        setIsAvatarSpeaking(false);
        onClose();
    }, [stopSpeaking, stopListening, onClose]);

    // Get status text with emoji
    const getStatusText = () => {
        switch (status) {
            case 'listening':
                return '🎤 Đang nghe...';
            case 'processing':
                return '⏳ Đang xử lý...';
            case 'speaking':
                return '🔊 Hannah đang nói...';
            default:
                return '💬 Nhấn mic để bắt đầu';
        }
    };

    // Get mic icon
    const getMicIcon = () => {
        if (isSpeaking) return <Volume2 />;
        if (isListening) return <MicOff />;
        return <Mic />;
    };

    if (!isOpen) return null;

    return (
        <div className="voice-mode-overlay">
            {/* 🆕 Particle background */}
            <ParticlesBackground />

            {/* Header */}
            <div className="voice-mode-header">
                <h2 className="voice-mode-title">Hannah AI</h2>
                <span className="voice-mode-badge">✨ Voice Mode</span>
            </div>

            {/* Close button */}
            <button className="voice-mode-close-btn" onClick={handleClose}>
                <X size={24} />
            </button>

            {/* 3D Canvas */}
            <div className="voice-mode-canvas-container">
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
                    <color attach="background" args={['#0a0a1a']} />
                    <Experience
                        isPlaying={isAvatarSpeaking}
                        onAudioEnd={handleAudioEnd}
                    />
                </Canvas>
            </div>

            {/* Controls */}
            <div className="voice-mode-controls">
                {/* 🆕 Waveform Visualizer */}
                <WaveformVisualizer status={status} />

                {/* Status */}
                <div className={`voice-mode-status ${status}`}>
                    {getStatusText()}
                </div>

                {/* Transcript with Typewriter */}
                {displayText && (
                    <div className={`voice-mode-transcript ${status} ${showTypewriter ? 'typewriter' : ''}`}>
                        <TypewriterText
                            text={displayText}
                            isActive={showTypewriter && status === 'speaking'}
                        />
                    </div>
                )}

                {/* Mic button */}
                <button
                    className={`voice-mode-mic-btn ${status}`}
                    onClick={handleMicClick}
                    disabled={status === 'processing'}
                >
                    {getMicIcon()}
                </button>

                {/* Hint */}
                <div className="voice-mode-hint">
                    {status === 'idle' && 'Nhấn vào mic để nói chuyện với Hannah'}
                    {status === 'listening' && 'Nhấn lần nữa để gửi hoặc đợi 2 giây'}
                    {status === 'speaking' && 'Nhấn để dừng Hannah nói'}
                    {error && <span style={{ color: '#ef4444' }}>{error}</span>}
                </div>
            </div>
        </div>
    );
}
