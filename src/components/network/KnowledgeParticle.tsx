import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';

interface KnowledgeParticleProps {
  fromId: string;
  toId: string;
  startTime: number;
}

const TRAVEL_DURATION = 1800; // ms

export default function KnowledgeParticle({ fromId, toId, startTime }: KnowledgeParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);

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

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / TRAVEL_DURATION, 1);
    // Ease in-out
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const pos = new THREE.Vector3().lerpVectors(from, to, eased);
    meshRef.current.position.copy(pos);

    // Pulse size
    const scale = 0.06 + Math.sin(t * Math.PI) * 0.04;
    meshRef.current.scale.setScalar(scale / 0.06);

    // Fade out near end
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = t > 0.85 ? (1 - t) / 0.15 : 1;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={1} />
    </mesh>
  );
}
