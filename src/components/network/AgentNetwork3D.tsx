import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';
import AgentNode from './AgentNode';
import ConnectionEdge from './ConnectionEdge';
import KnowledgeParticle from './KnowledgeParticle';
import NetworkCamera from './NetworkCamera';
import StarField from './StarField';
import Line3D from './Line3D';

// All pairs for the network web
function getStaticEdges() {
  const edges: [string, string][] = [];
  for (let i = 0; i < AGENTS.length; i++) {
    for (let j = i + 1; j < AGENTS.length; j++) {
      edges.push([AGENTS[i].id, AGENTS[j].id]);
    }
  }
  return edges;
}

const STATIC_EDGES = getStaticEdges();

// Neural energy line — curved connection with flowing dots (bright for bloom)
function NeuralEdge({ fromId, toId }: { fromId: string; toId: string }) {
  const lineRef = useRef<THREE.Line>(null);
  const dotsRef = useRef<THREE.Points>(null);
  const fromAgent = AGENTS.find((a) => a.id === fromId);
  const toAgent = AGENTS.find((a) => a.id === toId);
  if (!fromAgent || !toAgent) return null;

  const DOT_COUNT = 6;

  const { curve, geom } = useMemo(() => {
    const from = new THREE.Vector3(...fromAgent.position);
    const to = new THREE.Vector3(...toAgent.position);
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (perp.length() < 0.01) perp.set(1, 0, 0);
    mid.add(perp.multiplyScalar(0.15));

    const c = new THREE.QuadraticBezierCurve3(from, mid, to);
    const points = c.getPoints(30);
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return { curve: c, geom: g };
  }, [fromAgent, toAgent]);

  const dotPositions = useMemo(() => new Float32Array(DOT_COUNT * 3), []);

  const midColor = useMemo(() => {
    const c1 = new THREE.Color(fromAgent.color);
    const c2 = new THREE.Color(toAgent.color);
    return new THREE.Color().lerpColors(c1, c2, 0.5);
  }, [fromAgent.color, toAgent.color]);

  useFrame(() => {
    const t = Date.now();

    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 0.002 + fromAgent.position[0] * 10) * 0.06;
    }

    if (dotsRef.current) {
      const arr = dotsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < DOT_COUNT; i++) {
        const offset = i / DOT_COUNT;
        const progress = ((t * 0.00025 + offset) % 1);
        const pos = curve.getPoint(progress);
        arr[i * 3] = pos.x;
        arr[i * 3 + 1] = pos.y;
        arr[i * 3 + 2] = pos.z;
      }
      dotsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <Line3D ref={lineRef} geometry={geom}>
        <lineBasicMaterial color={midColor} transparent opacity={0.2} />
      </Line3D>
      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dotPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={midColor} size={0.045} transparent opacity={0.5} sizeAttenuation />
      </points>
    </group>
  );
}

// Neural grid — floor grid that bloom picks up
function NeuralGrid() {
  const ref = useRef<THREE.Group>(null);
  const globalConfidence = useSimStore((s) => s.globalConfidence);

  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = [];
    const size = 14;
    const step = 1.2;
    for (let x = -size; x <= size; x += step) {
      result.push([
        new THREE.Vector3(x, -4, -size),
        new THREE.Vector3(x, -4, size),
      ]);
    }
    for (let z = -size; z <= size; z += step) {
      result.push([
        new THREE.Vector3(-size, -4, z),
        new THREE.Vector3(size, -4, z),
      ]);
    }
    return result;
  }, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0002;
      const confFactor = globalConfidence / 100;
      ref.current.children.forEach((child) => {
        const line = child as THREE.Line;
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.15 + confFactor * 0.2;
        }
      });
    }
  });

  return (
    <group ref={ref}>
      {lines.map((pair, i) => {
        const geom = new THREE.BufferGeometry().setFromPoints(pair);
        return (
          <Line3D key={i} geometry={geom}>
            <lineBasicMaterial color="#122840" transparent opacity={0.18} />
          </Line3D>
        );
      })}
    </group>
  );
}

// Central energy core — pulsing, reacts to confidence, bloom makes it glow
function CentralCore() {
  const ref = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const globalConfidence = useSimStore((s) => s.globalConfidence);

  useFrame(() => {
    const t = Date.now();
    const confFactor = globalConfidence / 100;
    if (ref.current) {
      const scale = 0.35 + confFactor * 0.5 + Math.sin(t * 0.001) * 0.1;
      ref.current.scale.setScalar(scale);
      ref.current.rotation.y += 0.003;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + confFactor * 0.15 + Math.sin(t * 0.002) * 0.03;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= 0.004;
      wireRef.current.rotation.x += 0.001;
      const scale = 0.9 + confFactor * 0.8 + Math.sin(t * 0.0015) * 0.15;
      wireRef.current.scale.setScalar(scale);
      const mat = wireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + confFactor * 0.1 + Math.sin(t * 0.001) * 0.03;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.35, 2]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.1} />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial color="#5A8AAA" transparent opacity={0.08} wireframe />
      </mesh>
    </group>
  );
}

// Energy dome — large wireframe that's visible at high confidence
function EnergyDome() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const globalConfidence = useSimStore((s) => s.globalConfidence);

  useFrame(() => {
    const t = Date.now();
    const confFactor = globalConfidence / 100;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
      meshRef.current.rotation.x = Math.sin(t * 0.0003) * 0.1;
      const scale = 5.5 + confFactor * 2.5 + Math.sin(t * 0.001) * 0.3;
      meshRef.current.scale.setScalar(scale);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      // More visible — bloom will catch this
      mat.opacity = 0.02 + confFactor * 0.06;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= 0.0008;
      innerRef.current.rotation.z += 0.0003;
      const scale = 4.0 + confFactor * 2;
      innerRef.current.scale.setScalar(scale);
      const mat = innerRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.01 + confFactor * 0.04;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.03} wireframe />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#CE93D8" transparent opacity={0.02} wireframe />
      </mesh>
    </group>
  );
}

// Ambient floating particles — more when active
const AMBIENT_PARTICLE_COUNT = 250;
function AmbientActivityField() {
  const ref = useRef<THREE.Points>(null);
  const activeCount = useSimStore((s) => s.activeEdges.length);
  const globalConfidence = useSimStore((s) => s.globalConfidence);

  const positions = useMemo(() => {
    const arr = new Float32Array(AMBIENT_PARTICLE_COUNT * 3);
    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return arr;
  }, []);

  const speeds = useMemo(() => {
    const arr = new Float32Array(AMBIENT_PARTICLE_COUNT);
    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) arr[i] = 0.5 + Math.random() * 1.5;
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001;
    const activity = Math.min(activeCount / 3, 1);
    const confFactor = globalConfidence / 100;
    const posArr = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
      posArr[i * 3 + 1] += Math.sin(t * speeds[i] + i) * 0.003;
      if (posArr[i * 3 + 1] > 5) posArr[i * 3 + 1] = -5;
      if (posArr[i * 3 + 1] < -5) posArr[i * 3 + 1] = 5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.15 + activity * 0.2 + confFactor * 0.15;
    mat.size = 0.02 + activity * 0.02 + confFactor * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#6AB0E0" size={0.03} transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

// Invisible plane to catch background clicks and clear focus
function BackgroundClickPlane() {
  const handleClick = () => {
    useSimStore.getState().setFocusedAgent(null);
  };
  return (
    <mesh position={[0, 0, -15]} onClick={handleClick}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function AgentNetwork3D() {
  const activeEdges = useSimStore((s) => s.activeEdges);
  const focusedAgentId = useSimStore((s) => s.focusedAgentId);
  const focusedAgent = focusedAgentId ? AGENTS.find((a) => a.id === focusedAgentId) : null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Back to overview button */}
      {focusedAgent && (
        <button
          type="button"
          className="focus-back-btn"
          onClick={() => useSimStore.getState().setFocusedAgent(null)}
        >
          ← חזרה למבט כללי
        </button>
      )}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        style={{ background: '#030812' }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Lighting */}
        <ambientLight color="#0A1030" intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} color="#4A6A8A" />
        <directionalLight position={[-3, -2, 4]} intensity={0.15} color="#CE93D8" />

        {/* Background click to clear focus */}
        <BackgroundClickPlane />

        {/* Stars & atmosphere */}
        <StarField />
        <NeuralGrid />
        <CentralCore />
        <EnergyDome />
        <AmbientActivityField />

        {/* Static neural connections */}
        {STATIC_EDGES.map(([a, b]) => {
          const isActive = activeEdges.some(
            (e) =>
              (e.fromId === a && e.toId === b) ||
              (e.fromId === b && e.toId === a)
          );
          if (isActive) return null;
          return <NeuralEdge key={`static-${a}-${b}`} fromId={a} toId={b} />;
        })}

        {/* Active communication edges */}
        {activeEdges.map((edge) => (
          <group key={`active-${edge.fromId}-${edge.toId}-${edge.startTime}`}>
            <ConnectionEdge fromId={edge.fromId} toId={edge.toId} />
            <KnowledgeParticle
              fromId={edge.fromId}
              toId={edge.toId}
              startTime={edge.startTime}
            />
          </group>
        ))}

        {/* Agent nodes */}
        {AGENTS.map((agent) => (
          <AgentNode key={agent.id} agent={agent} />
        ))}

        <NetworkCamera />

        {/* Post-processing: Bloom makes everything glow */}
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
