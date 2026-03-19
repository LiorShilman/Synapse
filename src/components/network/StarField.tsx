import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Pre-computed random star positions (module-level to avoid Math.random in hooks)
function generateStarPositions(count: number, spread: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * spread;
    arr[i * 3 + 1] = (Math.random() - 0.5) * spread;
    arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  return arr;
}

const DEEP_POSITIONS = generateStarPositions(1200, 50);
const MID_POSITIONS = generateStarPositions(500, 35);
const BRIGHT_POSITIONS = generateStarPositions(80, 40);

// Deep star layer — tiny distant stars
function DeepStars() {
  const ref = useRef<THREE.Points>(null);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.00005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[DEEP_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#3A5A7A" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// Mid-layer stars with color variation
function MidStars() {
  const ref = useRef<THREE.Points>(null);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0001;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[MID_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#5A7A9A" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Bright accent stars — few, larger, colored
function BrightStars() {
  const ref = useRef<THREE.Points>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y -= 0.00008;
      const mat = ref.current.material as THREE.PointsMaterial;
      mat.opacity = 0.3 + Math.sin(Date.now() * 0.001) * 0.15;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[BRIGHT_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#7ABADF" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}


export default function StarField() {
  return (
    <group>
      <DeepStars />
      <MidStars />
      <BrightStars />
    </group>
  );
}
