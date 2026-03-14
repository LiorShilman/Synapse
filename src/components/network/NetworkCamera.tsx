import { OrbitControls } from '@react-three/drei';

export default function NetworkCamera() {
  return (
    <OrbitControls
      autoRotate
      autoRotateSpeed={0.4}
      enableZoom
      enablePan={false}
      enableRotate
      minDistance={4}
      maxDistance={14}
      dampingFactor={0.05}
      enableDamping
    />
  );
}
