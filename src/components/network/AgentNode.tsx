import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../../store/useSimStore';
import type { AgentDefinition } from '../../agents/agentDefinitions';

interface AgentNodeProps {
  agent: AgentDefinition;
}

export default function AgentNode({ agent }: AgentNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const isThinking = useSimStore((s) => s.agents[agent.id]?.isThinking);
  const confidence = useSimStore((s) => s.agents[agent.id]?.confidence ?? 30);

  const color = useMemo(() => new THREE.Color(agent.color), [agent.color]);
  const glowColor = useMemo(() => new THREE.Color(agent.glowColor), [agent.glowColor]);

  // Confidence drives visual intensity (0.3 to 1.0 range)
  const confFactor = confidence / 100;

  useFrame(() => {
    if (!meshRef.current || !glowRef.current || !lightRef.current) return;

    // Core sphere size grows with confidence (0.2 at 0% → 0.4 at 100%)
    const baseSize = 0.2 + confFactor * 0.2;
    const thinkPulse = isThinking
      ? 1 + Math.sin(Date.now() * 0.01) * 0.2
      : 1 + Math.sin(Date.now() * 0.002) * 0.03;
    meshRef.current.scale.setScalar(baseSize / 0.25 * thinkPulse);

    // Emissive intensity increases with confidence
    const mat = meshRef.current.material as THREE.MeshPhongMaterial;
    mat.emissiveIntensity = 0.3 + confFactor * 0.8;
    mat.opacity = 0.7 + confFactor * 0.3;

    // Glow halo grows with confidence and pulses
    const glowBase = 1.2 + confFactor * 1.5;
    const glowPulse = glowBase + Math.sin(Date.now() * 0.003) * 0.4;
    glowRef.current.scale.setScalar(glowPulse);
    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMat.opacity = 0.04 + confFactor * 0.12;

    // Light intensity tracks confidence
    lightRef.current.intensity = isThinking
      ? 1.5 + confFactor * 3
      : 0.5 + confFactor * 2;
    lightRef.current.distance = 3 + confFactor * 4;

    // Orbit ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.005 + confFactor * 0.01;
      ringRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.3;
      const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
      ringMat.opacity = isThinking ? 0.4 : 0.1 + confFactor * 0.15;
    }
  });

  return (
    <group position={agent.position}>
      {/* Core sphere */}
      <Sphere ref={meshRef} args={[0.25, 32, 32]}>
        <meshPhongMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          shininess={100}
          transparent
          opacity={0.95}
        />
      </Sphere>

      {/* Glow halo */}
      <Sphere ref={glowRef} args={[0.35, 16, 16]}>
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Orbit ring — shows activity */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45 + confFactor * 0.15, 0.008, 8, 64]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.15} />
      </mesh>

      {/* Point light */}
      <pointLight
        ref={lightRef}
        color={agent.color}
        intensity={1.2}
        distance={4}
        decay={2}
      />

      {/* Agent label */}
      <Html
        position={[0, 0.6 + confFactor * 0.2, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            color: agent.color,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '1px',
            textShadow: `0 0 20px ${agent.color}, 0 0 40px ${agent.color}50`,
            whiteSpace: 'nowrap',
          }}
        >
          {agent.name}
        </div>
      </Html>
    </group>
  );
}
