import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';
import AgentNode from './AgentNode';
import ConnectionEdge from './ConnectionEdge';
import KnowledgeParticle from './KnowledgeParticle';
import NetworkCamera from './NetworkCamera';
import StarField from './StarField';

// Static connections for the network web (all pairs)
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

export default function AgentNetwork3D() {
  const activeEdges = useSimStore((s) => s.activeEdges);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        style={{ background: '#030812' }}
      >
        {/* Lighting */}
        <ambientLight color="#0A1030" intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.2} color="#4A6A8A" />

        {/* Stars */}
        <StarField />

        {/* Static network web (dim lines) */}
        {STATIC_EDGES.map(([a, b]) => {
          const isActive = activeEdges.some(
            (e) =>
              (e.fromId === a && e.toId === b) ||
              (e.fromId === b && e.toId === a)
          );
          if (isActive) return null; // active edges rendered separately
          return (
            <group key={`static-${a}-${b}`}>
              <StaticEdge fromId={a} toId={b} />
            </group>
          );
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

// Dim static edge
function StaticEdge({ fromId, toId }: { fromId: string; toId: string }) {
  const fromAgent = AGENTS.find((a) => a.id === fromId);
  const toAgent = AGENTS.find((a) => a.id === toId);
  if (!fromAgent || !toAgent) return null;

  const lineObj = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([...fromAgent.position, ...toAgent.position]),
        3
      )
    );
    const mat = new THREE.LineBasicMaterial({
      color: '#1A2A4A',
      transparent: true,
      opacity: 0.3,
    });
    return new THREE.Line(geom, mat);
  }, [fromAgent, toAgent]);

  return <primitive object={lineObj} />;
}
