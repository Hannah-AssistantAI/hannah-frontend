import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { VOICE_CONFIG } from '../../config/voiceConfig';
import { VISEME_MAP, type LipSyncData } from './types';

// Facial expressions presets from source
const facialExpressions = {
    default: {},
    smile: {
        browInnerUp: 0.17,
        eyeSquintLeft: 0.4,
        eyeSquintRight: 0.44,
        noseSneerLeft: 0.17,
        noseSneerRight: 0.14,
        mouthPressLeft: 0.61,
        mouthPressRight: 0.41,
    },
    sad: {
        mouthFrownLeft: 1,
        mouthFrownRight: 1,
        mouthShrugLower: 0.78,
        browInnerUp: 0.45,
        eyeSquintLeft: 0.72,
        eyeSquintRight: 0.75,
        eyeLookDownLeft: 0.5,
        eyeLookDownRight: 0.5,
        jawForward: 1,
    },
    surprised: {
        eyeWideLeft: 0.5,
        eyeWideRight: 0.5,
        jawOpen: 0.35,
        mouthFunnel: 1,
        browInnerUp: 1,
    },
    happy: {
        browInnerUp: 0.2,
        eyeSquintLeft: 0.5,
        eyeSquintRight: 0.5,
        mouthSmileLeft: 0.7,
        mouthSmileRight: 0.7,
    },
};

interface Avatar3DProps {
    audioUrl?: string;
    lipSyncData?: LipSyncData;
    isPlaying?: boolean;
    onAudioEnd?: () => void;
    headFollow?: boolean;
    position?: [number, number, number];
    scale?: number | [number, number, number];
}

export function Avatar3D({
    audioUrl,
    lipSyncData,
    isPlaying = false,
    onAudioEnd,
    headFollow = true,
    ...props
}: Avatar3DProps) {
    const group = useRef<THREE.Group>(null);
    const [animation, setAnimation] = useState('Idle');
    const [blink, setBlink] = useState(false);
    const [facialExpression, setFacialExpression] = useState<keyof typeof facialExpressions>('default');

    // Load 3D model - Female Hannah avatar
    const { nodes, materials, scene } = useGLTF(VOICE_CONFIG.AVATAR.MODEL_PATH) as any;

    // Load animations bundle
    const { animations } = useGLTF('/models/animations.glb');

    // Setup animations
    const { actions, mixer } = useAnimations(animations, group);

    // Audio setup
    const audio = useMemo(() => {
        if (!audioUrl) return null;
        const a = new Audio(audioUrl);
        a.addEventListener('ended', () => {
            setAnimation('Idle');
            setFacialExpression('default');
            onAudioEnd?.();
        });
        return a;
    }, [audioUrl, onAudioEnd]);

    // Play/pause audio and animation
    useEffect(() => {
        if (isPlaying && audio) {
            audio.play();
            setAnimation('Talking_0');
            setFacialExpression('happy');
        } else if (audio) {
            audio.pause();
            audio.currentTime = 0;
            setAnimation('Idle');
            setFacialExpression('default');
        }

        return () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        };
    }, [isPlaying, audio]);

    // Play animation
    useEffect(() => {
        const action = actions[animation];
        if (action) {
            action.reset().fadeIn(0.5).play();
            return () => {
                action.fadeOut(0.5);
            };
        }
    }, [animation, actions, mixer]);

    // Natural blinking effect
    useEffect(() => {
        let blinkTimeout: ReturnType<typeof setTimeout>;
        const nextBlink = () => {
            blinkTimeout = setTimeout(() => {
                setBlink(true);
                setTimeout(() => {
                    setBlink(false);
                    nextBlink();
                }, 200);
            }, THREE.MathUtils.randInt(1000, 5000));
        };
        nextBlink();
        return () => clearTimeout(blinkTimeout);
    }, []);

    // Helper function to lerp morph targets
    const lerpMorphTarget = (target: string, value: number, speed = 0.1) => {
        scene.traverse((child: any) => {
            if (child.isSkinnedMesh && child.morphTargetDictionary) {
                const index = child.morphTargetDictionary[target];
                if (index === undefined || child.morphTargetInfluences[index] === undefined) {
                    return;
                }
                child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                    child.morphTargetInfluences[index],
                    value,
                    speed
                );
            }
        });
    };

    // Frame update for lip-sync, facial expressions, and blink
    useFrame(() => {
        // Apply facial expressions
        if (nodes.EyeLeft?.morphTargetDictionary) {
            Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
                const mapping = facialExpressions[facialExpression];
                if (key === 'eyeBlinkLeft' || key === 'eyeBlinkRight') {
                    return; // handled separately
                }
                if (mapping && (mapping as any)[key]) {
                    lerpMorphTarget(key, (mapping as any)[key], 0.1);
                } else {
                    lerpMorphTarget(key, 0, 0.1);
                }
            });
        }

        // Apply blink
        lerpMorphTarget('eyeBlinkLeft', blink ? 1 : 0, 0.5);
        lerpMorphTarget('eyeBlinkRight', blink ? 1 : 0, 0.5);

        // Lip-sync
        if (!audio || !lipSyncData || audio.paused) {
            // Reset all visemes when not playing
            Object.values(VISEME_MAP).forEach((viseme) => {
                lerpMorphTarget(viseme, 0, 0.5);
            });
            return;
        }

        const currentTime = audio.currentTime;

        // Reset all visemes first
        Object.values(VISEME_MAP).forEach((viseme) => {
            lerpMorphTarget(viseme, 0, 0.1);
        });

        // Find and apply current mouth cue
        for (const cue of lipSyncData.mouthCues) {
            if (currentTime >= cue.start && currentTime <= cue.end) {
                const viseme = VISEME_MAP[cue.value];
                if (viseme) {
                    lerpMorphTarget(viseme, 1, 0.2);
                }
                break;
            }
        }

        // Head follow camera
        if (headFollow && group.current) {
            const head = group.current.getObjectByName('Head');
            if (head) {
                head.lookAt(new THREE.Vector3(0, 0, 5));
            }
        }
    });

    return (
        <group {...props} dispose={null} ref={group}>
            <primitive object={nodes.Hips} />
            <skinnedMesh
                geometry={nodes.Wolf3D_Body.geometry}
                material={materials.Wolf3D_Body}
                skeleton={nodes.Wolf3D_Body.skeleton}
            />
            <skinnedMesh
                geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
                material={materials.Wolf3D_Outfit_Bottom}
                skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
            />
            <skinnedMesh
                geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
                material={materials.Wolf3D_Outfit_Footwear}
                skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
            />
            <skinnedMesh
                geometry={nodes.Wolf3D_Outfit_Top.geometry}
                material={materials.Wolf3D_Outfit_Top}
                skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
            />
            <skinnedMesh
                geometry={nodes.Wolf3D_Hair.geometry}
                material={materials.Wolf3D_Hair}
                skeleton={nodes.Wolf3D_Hair.skeleton}
            />
            <skinnedMesh
                name="EyeLeft"
                geometry={nodes.EyeLeft.geometry}
                material={materials.Wolf3D_Eye}
                skeleton={nodes.EyeLeft.skeleton}
                morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
                morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
            />
            <skinnedMesh
                name="EyeRight"
                geometry={nodes.EyeRight.geometry}
                material={materials.Wolf3D_Eye}
                skeleton={nodes.EyeRight.skeleton}
                morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
                morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
            />
            <skinnedMesh
                name="Wolf3D_Head"
                geometry={nodes.Wolf3D_Head.geometry}
                material={materials.Wolf3D_Skin}
                skeleton={nodes.Wolf3D_Head.skeleton}
                morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
                morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
            />
            <skinnedMesh
                name="Wolf3D_Teeth"
                geometry={nodes.Wolf3D_Teeth.geometry}
                material={materials.Wolf3D_Teeth}
                skeleton={nodes.Wolf3D_Teeth.skeleton}
                morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
                morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
            />
        </group>
    );
}

useGLTF.preload(VOICE_CONFIG.AVATAR.MODEL_PATH);
useGLTF.preload('/models/animations.glb');
