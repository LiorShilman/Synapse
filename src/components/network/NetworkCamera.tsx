import { OrbitControls } from '@react-three/drei';

export default function NetworkCamera() {
  return (
    <OrbitControls
      autoRotate
      autoRotateSpeed={0.3}
      enableZoom={false}
      enablePan={false}
      enableRotate={false}
    />
  );
}
