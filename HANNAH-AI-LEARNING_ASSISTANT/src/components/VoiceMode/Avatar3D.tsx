import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VOICE_CONFIG } from '../../config/voiceConfig';

// Viseme morph targets for ReadyPlayerMe models
const VISEMES = [
    'viseme_PP',  // P, B, M
    'viseme_FF',  // F, V
    'viseme_TH',  // TH
    'viseme_DD',  // T, D
    'viseme_kk',  // K, G
    'viseme_CH',  // CH, J, SH
    'viseme_SS',  // S, Z
    'viseme_nn',  // N, L
    'viseme_RR',  // R
    'viseme_AA',  // A
    'viseme_E',   // E
    'viseme_I',   // I
    'viseme_O',   // O
    'viseme_U',   // U
];

interface Avatar3DProps {
    isPlaying?: boolean;
    onAudioEnd?: () => void;
    headFollow?: boolean;
    position?: [number, number, number];
    scale?: number | [number, number, number];
}

export function Avatar3D({
    isPlaying = false,
    onAudioEnd,
    headFollow = true,
    ...props
}: Avatar3DProps) {
    const group = useRef<THREE.Group>(null);
    const [blink, setBlink] = useState(false);
    const talkingRef = useRef({ visemeIndex: 0, lastSwitch: 0 });

    // Load 3D model - Female Hannah avatar
    const { nodes, materials, scene } = useGLTF(VOICE_CONFIG.AVATAR.MODEL_PATH) as any;

    // Load animations bundle
    const { animations } = useGLTF('/models/animations.glb');

    // Setup animations
    const { actions } = useAnimations(animations, group);

    // Log available animations for debugging
    useEffect(() => {
        if (animations && animations.length > 0) {
            console.log('[Avatar3D] Available animations:', animations.map((a: any) => a.name));
        }
    }, [animations]);

    // Play animation based on speaking state
    useEffect(() => {
        // Find a valid animation
        const talkingAnim = actions['Talking_0'] || actions['Talking'] || actions['Talk'];
        const idleAnim = actions['Idle'] || actions['Standing Idle'] || Object.values(actions)[0];

        if (isPlaying && talkingAnim) {
            talkingAnim.reset().fadeIn(0.3).play();
            console.log('[Avatar3D] Playing talking animation');
            return () => {
                talkingAnim.fadeOut(0.3);
            };
        } else if (idleAnim) {
            idleAnim.reset().fadeIn(0.3).play();
            return () => {
                idleAnim.fadeOut(0.3);
            };
        }
    }, [isPlaying, actions]);

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

    // Frame update for lip-sync simulation and blink
    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Apply blink
        lerpMorphTarget('eyeBlinkLeft', blink ? 1 : 0, 0.5);
        lerpMorphTarget('eyeBlinkRight', blink ? 1 : 0, 0.5);

        // Simulated lip-sync when speaking
        if (isPlaying) {
            // Switch viseme every ~150ms for natural talking
            if (time - talkingRef.current.lastSwitch > 0.15) {
                talkingRef.current.visemeIndex = Math.floor(Math.random() * VISEMES.length);
                talkingRef.current.lastSwitch = time;
            }

            // Reset all visemes
            VISEMES.forEach((viseme, i) => {
                if (i === talkingRef.current.visemeIndex) {
                    lerpMorphTarget(viseme, 0.7, 0.4); // Active viseme
                } else {
                    lerpMorphTarget(viseme, 0, 0.3); // Inactive
                }
            });

            // Also animate jaw for more natural talking
            lerpMorphTarget('jawOpen', 0.2 + Math.sin(time * 8) * 0.15, 0.3);

            // Happy expression while talking
            lerpMorphTarget('mouthSmileLeft', 0.3, 0.1);
            lerpMorphTarget('mouthSmileRight', 0.3, 0.1);
        } else {
            // Reset all visemes when not speaking
            VISEMES.forEach((viseme) => {
                lerpMorphTarget(viseme, 0, 0.2);
            });
            lerpMorphTarget('jawOpen', 0, 0.2);
            lerpMorphTarget('mouthSmileLeft', 0.1, 0.1);
            lerpMorphTarget('mouthSmileRight', 0.1, 0.1);
        }

        // Head follow camera (subtle)
        if (headFollow && group.current) {
            const head = group.current.getObjectByName('Head');
            if (head) {
                // Subtle head movement toward camera
                const targetX = THREE.MathUtils.lerp(head.rotation.x, 0, 0.05);
                const targetY = THREE.MathUtils.lerp(head.rotation.y, 0.1, 0.05);
                head.rotation.x = targetX;
                head.rotation.y = targetY;
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
