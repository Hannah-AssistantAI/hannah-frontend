// Types for Voice Mode components

export interface LipSyncData {
    mouthCues: MouthCue[];
}

export interface MouthCue {
    start: number;
    end: number;
    value: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';
}

export interface Avatar3DProps {
    audioUrl?: string;
    lipSyncData?: LipSyncData;
    isPlaying?: boolean;
    onAudioEnd?: () => void;
}

export interface VoiceModeOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export const VISEME_MAP: Record<string, string> = {
    A: 'viseme_PP',
    B: 'viseme_kk',
    C: 'viseme_I',
    D: 'viseme_AA',
    E: 'viseme_O',
    F: 'viseme_U',
    G: 'viseme_FF',
    H: 'viseme_TH',
    X: 'viseme_PP',
};
