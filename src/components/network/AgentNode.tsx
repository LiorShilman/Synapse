import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../../store/useSimStore';
import type { AgentDefinition } from '../../agents/agentDefinitions';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

interface AgentNodeProps {
  agent: AgentDefinition;
}

// Thinking vortex — spiral of particles shooting upward when agent thinks
const VORTEX_COUNT = 60;
function ThinkingVortex({ color, active }: { color: string; active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => new Float32Array(VORTEX_COUNT * 3), []);
  const speeds = useMemo(() => {
    const arr = new Float32Array(VORTEX_COUNT);
    for (let i = 0; i < VORTEX_COUNT; i++) arr[i] = 0.3 + Math.random() * 0.7;
    return arr;
  }, []);
  const angles = useMemo(() => {
    const arr = new Float32Array(VORTEX_COUNT);
    for (let i = 0; i < VORTEX_COUNT; i++) arr[i] = Math.random() * Math.PI * 2;
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.PointsMaterial;
    if (!active) {
      mat.opacity *= 0.92;
      if (mat.opacity < 0.01) ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    mat.opacity = 0.8;
    const t = Date.now() * 0.003;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < VORTEX_COUNT; i++) {
      const phase = (t * speeds[i] + angles[i]) % (Math.PI * 2);
      const height = ((t * speeds[i] * 0.5 + i * 0.1) % 2.5);
      const radius = 0.15 + height * 0.3;
      arr[i * 3] = Math.cos(phase) * radius;
      arr[i * 3 + 1] = height - 0.3;
      arr[i * 3 + 2] = Math.sin(phase) * radius;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.035} transparent opacity={0} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

// Confidence progress arc — a ring that fills based on confidence percentage
function ConfidenceArc({ color, confidence }: { color: string; confidence: number }) {
  const arcRef = useRef<THREE.Mesh>(null);
  const bgRef = useRef<THREE.Mesh>(null);
  const confFactor = confidence / 100;

  // Arc angle: 0% = tiny sliver, 100% = full circle
  const arcAngle = confFactor * Math.PI * 2;
  const radius = 0.55;

  // Create arc geometry — a partial torus
  const arcGeom = useMemo(() => {
    const segments = Math.max(3, Math.floor(48 * confFactor));
    return new THREE.TorusGeometry(radius, 0.018, 6, segments, arcAngle);
  }, [arcAngle, radius]);

  // Full background ring (dim)
  const bgGeom = useMemo(() => {
    return new THREE.TorusGeometry(radius, 0.008, 6, 48);
  }, [radius]);

  useFrame(() => {
    const t = Date.now();
    if (arcRef.current) {
      // Slow rotation so arc sweeps around
      arcRef.current.rotation.z = -Math.PI / 2 + Math.sin(t * 0.0005) * 0.3;
      const mat = arcRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + confFactor * 0.5;
    }
    if (bgRef.current) {
      bgRef.current.rotation.z = Math.sin(t * 0.0003) * 0.1;
    }
  });

  return (
    <group rotation={[Math.PI / 3, 0, 0]}>
      {/* Background ring — dim full circle */}
      <mesh ref={bgRef} geometry={bgGeom}>
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      {/* Confidence arc — bright partial ring */}
      {confidence > 0 && (
        <mesh ref={arcRef} geometry={arcGeom}>
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// Energy burst — expanding particle shell on thought generation
function EnergyBurst({ color, active }: { color: string; active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const wasActive = useRef(false);
  const burstPhase = useRef(1); // 1 = done
  const BURST_COUNT = 40;
  const positions = useMemo(() => new Float32Array(BURST_COUNT * 3), []);
  const dirs = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < BURST_COUNT; i++) {
      arr.push(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize());
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    // Trigger burst on rising edge of active
    if (active && !wasActive.current) {
      burstPhase.current = 0;
    }
    wasActive.current = active;

    const mat = ref.current.material as THREE.PointsMaterial;
    if (burstPhase.current >= 1) {
      mat.opacity = 0;
      return;
    }
    burstPhase.current += 0.02;
    const p = burstPhase.current;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < BURST_COUNT; i++) {
      const r = p * 1.5;
      arr[i * 3] = dirs[i].x * r;
      arr[i * 3 + 1] = dirs[i].y * r;
      arr[i * 3 + 2] = dirs[i].z * r;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    mat.opacity = (1 - p) * 0.9;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.06} transparent opacity={0} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
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
      <pointsMaterial color={color} size={0.03} transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function AgentNode({ agent }: AgentNodeProps) {
  const isMobile = useIsMobile();
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulse2Ref = useRef<THREE.Mesh>(null);
  const pulsePhase = useRef(0);
  const pulse2Phase = useRef(0.5);

  const isThinking = useSimStore((s) => s.agents[agent.id]?.isThinking);
  const confidence = useSimStore((s) => s.agents[agent.id]?.confidence ?? 0);

  const color = useMemo(() => new THREE.Color(agent.color), [agent.color]);
  const confFactor = confidence / 100;

  useFrame(() => {
    const t = Date.now();
    if (!coreRef.current || !wireRef.current) return;

    // Core icosahedron: dramatic confidence-based scale (0.10 → 0.45)
    const baseScale = 0.10 + confFactor * 0.35;
    const thinkPulse = isThinking
      ? 1 + Math.sin(t * 0.008) * 0.25
      : 1 + Math.sin(t * 0.002) * 0.04;
    coreRef.current.scale.setScalar(baseScale / 0.15 * thinkPulse);
    coreRef.current.rotation.y += isThinking ? 0.02 : 0.003;
    coreRef.current.rotation.x += 0.001;

    const coreMat = coreRef.current.material as THREE.MeshPhongMaterial;
    coreMat.emissiveIntensity = 0.8 + confFactor * 2.0 + (isThinking ? Math.sin(t * 0.01) * 0.6 : 0);

    // Wireframe shell: counter-rotates, scales with confidence
    const wireScale = (0.18 + confFactor * 0.35) / 0.22;
    wireRef.current.scale.setScalar(wireScale * (1 + Math.sin(t * 0.003) * 0.08));
    wireRef.current.rotation.y -= isThinking ? 0.015 : 0.002;
    wireRef.current.rotation.z += 0.001;
    const wireMat = wireRef.current.material as THREE.MeshBasicMaterial;
    wireMat.opacity = 0.2 + confFactor * 0.4 + (isThinking ? 0.3 : 0);

    // Dual expanding pulse waves when thinking (staggered)
    [
      { ref: pulseRef, phase: pulsePhase },
      { ref: pulse2Ref, phase: pulse2Phase },
    ].forEach(({ ref: pRef, phase }) => {
      if (!pRef.current) return;
      const pMat = pRef.current.material as THREE.MeshBasicMaterial;
      if (isThinking) {
        phase.current = (phase.current + 0.012) % 1;
        const p = phase.current;
        const pulseScale = 0.5 + p * 4.0;
        pRef.current.scale.setScalar(pulseScale);
        pMat.opacity = (1 - p * p) * 0.25;
        pRef.current.visible = true;
      } else {
        pMat.opacity *= 0.9;
        if (pMat.opacity < 0.005) pRef.current.visible = false;
      }
    });

    // Orbit rings — each at different speed and axis
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += 0.01 + confFactor * 0.02;
      ring1Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.001) * 0.2;
      const r1Mat = ring1Ref.current.material as THREE.MeshBasicMaterial;
      r1Mat.opacity = isThinking ? 0.6 : 0.1 + confFactor * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= 0.008 + confFactor * 0.015;
      ring2Ref.current.rotation.x = -Math.PI / 4 + Math.cos(t * 0.0008) * 0.15;
      const r2Mat = ring2Ref.current.material as THREE.MeshBasicMaterial;
      r2Mat.opacity = isThinking ? 0.45 : 0.07 + confFactor * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += 0.005 + confFactor * 0.01;
      ring3Ref.current.rotation.y += 0.004;
      ring3Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.0012) * 0.1;
      const r3Mat = ring3Ref.current.material as THREE.MeshBasicMaterial;
      r3Mat.opacity = isThinking ? 0.35 : 0.05 + confFactor * 0.15;
    }

    // Light — dramatic
    if (lightRef.current) {
      lightRef.current.intensity = isThinking
        ? 2.5 + confFactor * 4 + Math.sin(t * 0.01) * 1.5
        : 1 + confFactor * 3;
      lightRef.current.distance = 4 + confFactor * 5;
    }

    // Subtle float
    if (groupRef.current) {
      groupRef.current.position.y = agent.position[1] + Math.sin(t * 0.001 + agent.position[0]) * 0.08;
    }
  });

  const ringRadius1 = 0.28 + confFactor * 0.35;
  const ringRadius2 = 0.38 + confFactor * 0.30;
  const ringRadius3 = 0.48 + confFactor * 0.25;

  return (
    <group ref={groupRef} position={agent.position}>
      {/* Inner core — icosahedron, bright emissive for bloom */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.15, 1]} />
        <meshPhongMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          shininess={200}
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
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Confidence progress arc — visible percentage ring */}
      <ConfidenceArc color={agent.color} confidence={confidence} />

      {/* Three orbit rings at different angles */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[ringRadius1, 0.01, 8, 80]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.25} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[ringRadius2, 0.008, 8, 80]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius3, 0.006, 8, 60]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Orbital micro-particles */}
      <OrbitalParticles color={agent.color} count={30} radius={ringRadius1} speed={0.006 + confFactor * 0.015} />
      <OrbitalParticles color={agent.color} count={20} radius={ringRadius2} speed={-0.004 - confFactor * 0.01} />

      {/* Thinking vortex — spiral particles */}
      <ThinkingVortex color={agent.color} active={!!isThinking} />

      {/* Energy burst on thought start */}
      <EnergyBurst color={agent.color} active={!!isThinking} />


      {/* Point light */}
      <pointLight
        ref={lightRef}
        color={agent.color}
        intensity={2}
        distance={6}
        decay={2}
      />

      {/* Dual thinking pulse waves */}
      <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.85, 1.0, 48]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={pulse2Ref} rotation={[0, 0, Math.PI / 2]} visible={false}>
        <ringGeometry args={[0.85, 1.0, 48]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Agent label */}
      <Html
        position={[0, 0.85 + confFactor * 0.25, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        className="agent-label-3d"
      >
        <div style={{
          color: agent.color,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: isMobile ? '11px' : '20px',
          fontWeight: 700,
          letterSpacing: isMobile ? '1px' : '2px',
          textShadow: `0 0 15px ${agent.color}, 0 0 40px ${agent.color}80, 0 0 80px ${agent.color}40`,
          whiteSpace: 'nowrap',
          opacity: 0.6 + confFactor * 0.4,
        }}>
          {agent.name}
        </div>
        {confidence > 0 && (
          <div style={{
            color: agent.color,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isMobile ? '8px' : '12px',
            textAlign: 'center',
            opacity: 0.5 + confFactor * 0.5,
            marginTop: '2px',
            textShadow: `0 0 10px ${agent.color}`,
          }}>
            {confidence}%
          </div>
        )}
      </Html>
    </group>
  );
}
