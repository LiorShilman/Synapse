import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';

export default function NetworkCamera() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const focusedAgentId = useSimStore((s) => s.focusedAgentId);

  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 12));
  const isAnimating = useRef(false);
  const prevFocusedId = useRef<string | null>(null);

  useEffect(() => {
    if (focusedAgentId) {
      const agent = AGENTS.find((a) => a.id === focusedAgentId);
      if (agent) {
        const agentPos = new THREE.Vector3(...agent.position);
        targetPos.current.copy(agentPos);
        // Camera looks at agent from a close position offset toward the camera
        const dir = new THREE.Vector3().subVectors(camera.position, agentPos).normalize();
        targetCamPos.current.copy(agentPos).add(dir.multiplyScalar(4));
        isAnimating.current = true;
      }
    } else if (prevFocusedId.current !== null) {
      // Only animate back to default when transitioning FROM a focused agent
      targetPos.current.set(0, 0, 0);
      targetCamPos.current.set(0, 0, 12);
      isAnimating.current = true;
    }
    prevFocusedId.current = focusedAgentId;
  }, [focusedAgentId, camera]);

  useFrame(() => {
    if (!isAnimating.current || !controlsRef.current) return;

    // Smoothly lerp camera and target
    camera.position.lerp(targetCamPos.current, 0.04);
    controlsRef.current.target.lerp(targetPos.current, 0.04);
    controlsRef.current.update();

    // Stop animating when close enough
    const camDist = camera.position.distanceTo(targetCamPos.current);
    const tgtDist = controlsRef.current.target.distanceTo(targetPos.current);
    if (camDist < 0.05 && tgtDist < 0.05) {
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={!focusedAgentId}
      autoRotateSpeed={0.4}
      enableZoom
      enablePan={false}
      enableRotate
      minDistance={3}
      maxDistance={22}
      dampingFactor={0.05}
      enableDamping
    />
  );
}
