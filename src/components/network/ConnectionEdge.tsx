import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';

interface ConnectionEdgeProps {
  fromId: string;
  toId: string;
}

export default function ConnectionEdge({ fromId, toId }: ConnectionEdgeProps) {
  const lineRef = useRef<THREE.Line>(null);

  const fromAgent = AGENTS.find((a) => a.id === fromId);
  const toAgent = AGENTS.find((a) => a.id === toId);
  const color = fromAgent?.color ?? '#4FC3F7';

  const positions = useMemo(() => {
    if (!fromAgent || !toAgent) return new Float32Array(6);
    return new Float32Array([
      ...fromAgent.position,
      ...toAgent.position,
    ]);
  }, [fromAgent, toAgent]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  useFrame(() => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.needsUpdate = true;
  });

  return (
    <primitive object={new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })
    )} />
  );
}
