import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../../store/useSimStore';
import type { AgentDefinition } from '../../agents/agentDefinitions';

interface AgentNodeProps {
  agent: AgentDefinition;
}

// Orbiting micro-particles around the node
function OrbitalParticles({ color, count, radius, speed }: {
  color: string; count: number; radius: number; speed: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.15;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, [count, radius]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += speed;
      ref.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.2;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.025} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function AgentNode({ agent }: AgentNodeProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  const isThinking = useSimStore((s) => s.agents[agent.id]?.isThinking);
  const confidence = useSimStore((s) => s.agents[agent.id]?.confidence ?? 0);

  const color = useMemo(() => new THREE.Color(agent.color), [agent.color]);
  const glowColor = useMemo(() => new THREE.Color(agent.glowColor), [agent.glowColor]);
  const confFactor = confidence / 100;

  useFrame(() => {
    const t = Date.now();
    if (!coreRef.current || !wireRef.current || !shellRef.current) return;

    // Core icosahedron: subtle rotation and confidence-based scale
    const baseScale = 0.15 + confFactor * 0.15;
    const thinkPulse = isThinking
      ? 1 + Math.sin(t * 0.008) * 0.15
      : 1 + Math.sin(t * 0.002) * 0.03;
    coreRef.current.scale.setScalar(baseScale / 0.15 * thinkPulse);
    coreRef.current.rotation.y += isThinking ? 0.015 : 0.003;
    coreRef.current.rotation.x += 0.001;

    const coreMat = coreRef.current.material as THREE.MeshPhongMaterial;
    coreMat.emissiveIntensity = 0.4 + confFactor * 1.2 + (isThinking ? Math.sin(t * 0.01) * 0.3 : 0);

    // Wireframe shell: counter-rotates, scales with confidence
    const wireScale = (0.22 + confFactor * 0.18) / 0.22;
    wireRef.current.scale.setScalar(wireScale * (1 + Math.sin(t * 0.003) * 0.05));
    wireRef.current.rotation.y -= isThinking ? 0.012 : 0.002;
    wireRef.current.rotation.z += 0.001;
    const wireMat = wireRef.current.material as THREE.MeshBasicMaterial;
    wireMat.opacity = 0.08 + confFactor * 0.2 + (isThinking ? 0.15 : 0);

    // Outer glow shell
    const shellScale = 1.8 + confFactor * 2.5 + Math.sin(t * 0.002) * 0.3;
    shellRef.current.scale.setScalar(shellScale);
    const shellMat = shellRef.current.material as THREE.MeshBasicMaterial;
    shellMat.opacity = 0.02 + confFactor * 0.06;

    // Orbit rings — each at different speed and axis
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += 0.008 + confFactor * 0.015;
      ring1Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.001) * 0.2;
      const r1Mat = ring1Ref.current.material as THREE.MeshBasicMaterial;
      r1Mat.opacity = isThinking ? 0.45 : 0.08 + confFactor * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= 0.006 + confFactor * 0.01;
      ring2Ref.current.rotation.x = -Math.PI / 4 + Math.cos(t * 0.0008) * 0.15;
      const r2Mat = ring2Ref.current.material as THREE.MeshBasicMaterial;
      r2Mat.opacity = isThinking ? 0.35 : 0.05 + confFactor * 0.15;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += 0.004 + confFactor * 0.008;
      ring3Ref.current.rotation.y += 0.003;
      ring3Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.0012) * 0.1;
      const r3Mat = ring3Ref.current.material as THREE.MeshBasicMaterial;
      r3Mat.opacity = isThinking ? 0.25 : 0.03 + confFactor * 0.1;
    }

    // Light
    if (lightRef.current) {
      lightRef.current.intensity = isThinking
        ? 2 + confFactor * 4 + Math.sin(t * 0.01) * 1.5
        : 0.5 + confFactor * 2.5;
      lightRef.current.distance = 3 + confFactor * 5;
    }

    // Subtle float
    if (groupRef.current) {
      groupRef.current.position.y = agent.position[1] + Math.sin(t * 0.001 + agent.position[0]) * 0.05;
    }
  });

  const ringRadius1 = 0.35 + confFactor * 0.15;
  const ringRadius2 = 0.45 + confFactor * 0.12;
  const ringRadius3 = 0.55 + confFactor * 0.1;

  return (
    <group ref={groupRef} position={agent.position}>
      {/* Inner core — icosahedron (more "digital" than sphere) */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.15, 1]} />
        <meshPhongMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          shininess={150}
          transparent
          opacity={0.95}
          flatShading
        />
      </mesh>

      {/* Wireframe shell — icosahedron wireframe */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshBasicMaterial
          color={agent.color}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh ref={shellRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Three orbit rings at different angles */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[ringRadius1, 0.006, 6, 80]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.15} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[ringRadius2, 0.004, 6, 80]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.1} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius3, 0.003, 6, 60]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.06} />
      </mesh>

      {/* Orbital micro-particles */}
      <OrbitalParticles color={agent.color} count={24} radius={ringRadius1} speed={0.005 + confFactor * 0.01} />
      <OrbitalParticles color={agent.color} count={16} radius={ringRadius2} speed={-0.003 - confFactor * 0.007} />

      {/* Point light */}
      <pointLight
        ref={lightRef}
        color={agent.color}
        intensity={1.5}
        distance={5}
        decay={2}
      />

      {/* Agent label */}
      <Html
        position={[0, 0.75 + confFactor * 0.15, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          color: agent.color,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '2px',
          textShadow: `0 0 12px ${agent.color}, 0 0 30px ${agent.color}60, 0 0 60px ${agent.color}20`,
          whiteSpace: 'nowrap',
          opacity: 0.5 + confFactor * 0.5,
        }}>
          {agent.name}
        </div>
        {confidence > 0 && (
          <div style={{
            color: agent.color,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            textAlign: 'center',
            opacity: 0.4 + confFactor * 0.4,
            marginTop: '2px',
            textShadow: `0 0 8px ${agent.color}80`,
          }}>
            {confidence}%
          </div>
        )}
      </Html>
    </group>
  );
}
