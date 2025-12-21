import { useAnimations, useFBX, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { VISEME_MAP, type LipSyncData } from './types';

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

    // Load 3D model - using Wolf3D avatar (Mixamo model has different structure)
    const { nodes, materials } = useGLTF('/models/646d9dcdc8a5f5bddbfac913.glb') as any;

    // Load animations
    const { animations: idleAnimation } = useFBX('/animations/Idle.fbx');
    const { animations: greetingAnimation } = useFBX('/animations/Standing Greeting.fbx');

    // Set animation names
    if (idleAnimation[0]) idleAnimation[0].name = 'Idle';
    if (greetingAnimation[0]) greetingAnimation[0].name = 'Greeting';

    // Setup animations
    const { actions } = useAnimations(
        [idleAnimation[0], greetingAnimation[0]].filter(Boolean),
        group
    );

    // Audio setup
    const audio = useMemo(() => {
        if (!audioUrl) return null;
        const a = new Audio(audioUrl);
        a.addEventListener('ended', () => {
            setAnimation('Idle');
            onAudioEnd?.();
        });
        return a;
    }, [audioUrl, onAudioEnd]);

    // Play/pause audio and animation
    useEffect(() => {
        if (isPlaying && audio) {
            audio.play();
            setAnimation('Greeting');
        } else if (audio) {
            audio.pause();
            audio.currentTime = 0;
            setAnimation('Idle');
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
    }, [animation, actions]);

    // Lip-sync frame update
    useFrame((state) => {
        if (!audio || !lipSyncData || audio.paused) {
            // Reset all visemes when not playing
            Object.values(VISEME_MAP).forEach((viseme) => {
                if (nodes.Wolf3D_Head?.morphTargetDictionary?.[viseme] !== undefined) {
                    const idx = nodes.Wolf3D_Head.morphTargetDictionary[viseme];
                    nodes.Wolf3D_Head.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                        nodes.Wolf3D_Head.morphTargetInfluences[idx],
                        0,
                        0.5
                    );
                }
                if (nodes.Wolf3D_Teeth?.morphTargetDictionary?.[viseme] !== undefined) {
                    const idx = nodes.Wolf3D_Teeth.morphTargetDictionary[viseme];
                    nodes.Wolf3D_Teeth.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                        nodes.Wolf3D_Teeth.morphTargetInfluences[idx],
                        0,
                        0.5
                    );
                }
            });
            return;
        }

        const currentTime = audio.currentTime;

        // Reset all visemes
        Object.values(VISEME_MAP).forEach((viseme) => {
            if (nodes.Wolf3D_Head?.morphTargetDictionary?.[viseme] !== undefined) {
                const idx = nodes.Wolf3D_Head.morphTargetDictionary[viseme];
                nodes.Wolf3D_Head.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                    nodes.Wolf3D_Head.morphTargetInfluences[idx],
                    0,
                    0.5
                );
            }
            if (nodes.Wolf3D_Teeth?.morphTargetDictionary?.[viseme] !== undefined) {
                const idx = nodes.Wolf3D_Teeth.morphTargetDictionary[viseme];
                nodes.Wolf3D_Teeth.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                    nodes.Wolf3D_Teeth.morphTargetInfluences[idx],
                    0,
                    0.5
                );
            }
        });

        // Find current mouth cue
        for (const cue of lipSyncData.mouthCues) {
            if (currentTime >= cue.start && currentTime <= cue.end) {
                const viseme = VISEME_MAP[cue.value];
                if (viseme && nodes.Wolf3D_Head?.morphTargetDictionary?.[viseme] !== undefined) {
                    const headIdx = nodes.Wolf3D_Head.morphTargetDictionary[viseme];
                    nodes.Wolf3D_Head.morphTargetInfluences[headIdx] = THREE.MathUtils.lerp(
                        nodes.Wolf3D_Head.morphTargetInfluences[headIdx],
                        1,
                        0.5
                    );
                }
                if (viseme && nodes.Wolf3D_Teeth?.morphTargetDictionary?.[viseme] !== undefined) {
                    const teethIdx = nodes.Wolf3D_Teeth.morphTargetDictionary[viseme];
                    nodes.Wolf3D_Teeth.morphTargetInfluences[teethIdx] = THREE.MathUtils.lerp(
                        nodes.Wolf3D_Teeth.morphTargetInfluences[teethIdx],
                        1,
                        0.5
                    );
                }
                break;
            }
        }

        // Head follow camera
        if (headFollow && group.current) {
            const head = group.current.getObjectByName('Head');
            if (head) {
                head.lookAt(state.camera.position);
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

useGLTF.preload('/models/646d9dcdc8a5f5bddbfac913.glb');
