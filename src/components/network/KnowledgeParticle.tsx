import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';

interface KnowledgeParticleProps {
  fromId: string;
  toId: string;
  startTime: number;
}

const TRAVEL_DURATION = 1800;
const TRAIL_COUNT = 6;

export default function KnowledgeParticle({ fromId, toId, startTime }: KnowledgeParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);

  const fromAgent = AGENTS.find((a) => a.id === fromId);
  const toAgent = AGENTS.find((a) => a.id === toId);
  const color = fromAgent?.color ?? '#4FC3F7';

  const from = useMemo(
    () => (fromAgent ? new THREE.Vector3(...fromAgent.position) : new THREE.Vector3()),
    [fromAgent]
  );
  const to = useMemo(
    () => (toAgent ? new THREE.Vector3(...toAgent.position) : new THREE.Vector3()),
    [toAgent]
  );
  const mid = useMemo(() => {
    const m = new THREE.Vector3().lerpVectors(from, to, 0.5);
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (perp.length() < 0.01) perp.set(1, 0, 0);
    m.add(perp.multiplyScalar(0.4));
    m.y += 0.3;
    return m;
  }, [from, to]);

  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(from, mid, to),
    [from, mid, to]
  );

  const trailPositions = useMemo(() => new Float32Array(TRAIL_COUNT * 3), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / TRAVEL_DURATION, 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // Main particle follows curve
    const pos = curve.getPoint(eased);
    meshRef.current.position.copy(pos);

    // Pulsing scale
    const scale = 1 + Math.sin(t * Math.PI * 3) * 0.4;
    meshRef.current.scale.setScalar(scale);
    meshRef.current.rotation.y += 0.05;
    meshRef.current.rotation.z += 0.03;

    // Fade
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = t > 0.85 ? (1 - t) / 0.15 : 0.9;

    // Glow follows
    if (glowRef.current) {
      glowRef.current.position.copy(pos);
      glowRef.current.scale.setScalar(scale * 2.5);
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial;
      gMat.opacity = (t > 0.85 ? (1 - t) / 0.15 : 0.6) * 0.15;
    }

    // Trail particles
    if (trailRef.current) {
      const arr = trailRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const trailT = Math.max(0, eased - (i + 1) * 0.04);
        const trailPos = curve.getPoint(trailT);
        arr[i * 3] = trailPos.x;
        arr[i * 3 + 1] = trailPos.y;
        arr[i * 3 + 2] = trailPos.z;
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
      const tMat = trailRef.current.material as THREE.PointsMaterial;
      tMat.opacity = t > 0.85 ? (1 - t) / 0.15 * 0.5 : 0.5;
    }
  });

  return (
    <group>
      {/* Core particle — bright for bloom glow */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshBasicMaterial color={color} transparent opacity={1.0} />
      </mesh>
      {/* Glow around particle — bloom amplifies this */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
      {/* Trail — brighter */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.05} transparent opacity={0.8} sizeAttenuation />
      </points>
    </group>
  );
}
