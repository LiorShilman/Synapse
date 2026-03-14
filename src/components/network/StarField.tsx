import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Deep star layer — tiny distant stars
function DeepStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 1200;

  const [positions, _sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      sz[i] = 0.01 + Math.random() * 0.025;
    }
    return [pos, sz];
  }, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.00005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#3A5A7A" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// Mid-layer stars with color variation
function MidStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 500;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 35;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 35;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0001;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#5A7A9A" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Bright accent stars — few, larger, colored
function BrightStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 80;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#7ABADF" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// Subtle nebula clouds
function Nebula({ position, color, scale }: {
  position: [number, number, number]; color: string; scale: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.z += 0.0002;
      ref.current.rotation.x += 0.0001;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[scale, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.015} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function StarField() {
  return (
    <group>
      <DeepStars />
      <MidStars />
      <BrightStars />
      {/* Nebula glow clouds for depth */}
      <Nebula position={[-6, 4, -12]} color="#4FC3F7" scale={5} />
      <Nebula position={[8, -3, -15]} color="#CE93D8" scale={6} />
      <Nebula position={[0, -6, -10]} color="#FFAB40" scale={4} />
      <Nebula position={[5, 5, -8]} color="#66BB6A" scale={3.5} />
    </group>
  );
}
