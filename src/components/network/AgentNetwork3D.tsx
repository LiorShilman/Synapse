import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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

// Neural energy line — curved connection with flowing dots
function NeuralEdge({ fromId, toId }: { fromId: string; toId: string }) {
  const lineRef = useRef<THREE.Line>(null);
  const dotsRef = useRef<THREE.Points>(null);
  const fromAgent = AGENTS.find((a) => a.id === fromId);
  const toAgent = AGENTS.find((a) => a.id === toId);
  if (!fromAgent || !toAgent) return null;

  const DOT_COUNT = 4;

  const { curve, geom } = useMemo(() => {
    const from = new THREE.Vector3(...fromAgent.position);
    const to = new THREE.Vector3(...toAgent.position);
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    // Subtle outward curve
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

  useFrame(() => {
    const t = Date.now();

    // Subtle pulse on the line
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 0.002 + fromAgent.position[0] * 10) * 0.04;
    }

    // Flowing dots along the curve
    if (dotsRef.current) {
      const arr = dotsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < DOT_COUNT; i++) {
        const offset = i / DOT_COUNT;
        const progress = ((t * 0.0002 + offset) % 1);
        const pos = curve.getPoint(progress);
        arr[i * 3] = pos.x;
        arr[i * 3 + 1] = pos.y;
        arr[i * 3 + 2] = pos.z;
      }
      dotsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Blend color between the two agents
  const midColor = useMemo(() => {
    const c1 = new THREE.Color(fromAgent.color);
    const c2 = new THREE.Color(toAgent.color);
    return new THREE.Color().lerpColors(c1, c2, 0.5);
  }, [fromAgent.color, toAgent.color]);

  return (
    <group>
      <Line3D ref={lineRef} geometry={geom}>
        <lineBasicMaterial color={midColor} transparent opacity={0.1} />
      </Line3D>
      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dotPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={midColor} size={0.03} transparent opacity={0.25} sizeAttenuation />
      </points>
    </group>
  );
}

// Ambient neural grid — a subtle hexagonal grid plane
function NeuralGrid() {
  const ref = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = [];
    const size = 12;
    const step = 1.2;
    // Grid lines in X-Z plane
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
      ref.current.rotation.y += 0.00015;
    }
  });

  return (
    <group ref={ref}>
      {lines.map((pair, i) => {
        const geom = new THREE.BufferGeometry().setFromPoints(pair);
        return (
          <Line3D key={i} geometry={geom}>
            <lineBasicMaterial color="#0D1A30" transparent opacity={0.25} />
          </Line3D>
        );
      })}
    </group>
  );
}

// Central energy core — a faint pulsing sphere at the center of the network
function CentralCore() {
  const ref = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = Date.now();
    if (ref.current) {
      const scale = 0.3 + Math.sin(t * 0.001) * 0.05;
      ref.current.scale.setScalar(scale);
      ref.current.rotation.y += 0.002;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.03 + Math.sin(t * 0.002) * 0.015;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= 0.003;
      wireRef.current.rotation.x += 0.001;
      const scale = 0.8 + Math.sin(t * 0.0015) * 0.1;
      wireRef.current.scale.setScalar(scale);
      const mat = wireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.04 + Math.sin(t * 0.001) * 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.3, 2]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.04} />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial color="#4A6A8A" transparent opacity={0.04} wireframe />
      </mesh>
    </group>
  );
}

export default function AgentNetwork3D() {
  const activeEdges = useSimStore((s) => s.activeEdges);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: '#030812' }}
      >
        {/* Lighting */}
        <ambientLight color="#0A1030" intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.15} color="#4A6A8A" />
        <directionalLight position={[-3, -2, 4]} intensity={0.08} color="#CE93D8" />

        {/* Stars & atmosphere */}
        <StarField />
        <NeuralGrid />
        <CentralCore />

        {/* Static neural connections (dim curved lines with flowing dots) */}
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
      </Canvas>
    </div>
  );
}
