import { Environment, OrbitControls } from '@react-three/drei';
import { Avatar3D } from './Avatar3D';

interface ExperienceProps {
    isPlaying?: boolean;
    onAudioEnd?: () => void;
}

export function Experience({
    isPlaying,
    onAudioEnd,
}: ExperienceProps) {
    return (
        <>
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 2}
            />
            <Avatar3D
                position={[0, -3, 5]}
                scale={2}
                isPlaying={isPlaying}
                onAudioEnd={onAudioEnd}
            />
            <Environment preset="sunset" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
        </>
    );
}
