import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';
import Line3D from './Line3D';

interface ConnectionEdgeProps {
  fromId: string;
  toId: string;
}

const CURVE_SEGMENTS = 40;
const FLOW_PARTICLE_COUNT = 8;

export default function ConnectionEdge({ fromId, toId }: ConnectionEdgeProps) {
  const lineRef = useRef<THREE.Line>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Line>(null);

  const fromAgent = AGENTS.find((a) => a.id === fromId);
  const toAgent = AGENTS.find((a) => a.id === toId);
  const color = fromAgent?.color ?? '#4FC3F7';

  const { curve, curvePoints } = useMemo(() => {
    if (!fromAgent || !toAgent) {
      const c = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
      );
      return { curve: c, curvePoints: c.getPoints(CURVE_SEGMENTS) };
    }
    const from = new THREE.Vector3(...fromAgent.position);
    const to = new THREE.Vector3(...toAgent.position);
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    // Curve outward perpendicular to the connection line
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (perp.length() < 0.01) perp.set(1, 0, 0);
    mid.add(perp.multiplyScalar(0.4));
    mid.y += 0.3;

    const c = new THREE.QuadraticBezierCurve3(from, mid, to);
    return { curve: c, curvePoints: c.getPoints(CURVE_SEGMENTS) };
  }, [fromAgent, toAgent]);

  const lineGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(curvePoints);
    return geom;
  }, [curvePoints]);

  // Flowing particles along the curve
  const particlePositions = useMemo(() => new Float32Array(FLOW_PARTICLE_COUNT * 3), []);

  useFrame(() => {
    const t = Date.now();

    // Animate line opacity pulse
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 0.005) * 0.2;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 0.004) * 0.1;
    }

    // Flow particles along curve
    if (particlesRef.current) {
      const posArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < FLOW_PARTICLE_COUNT; i++) {
        const offset = (i / FLOW_PARTICLE_COUNT);
        const progress = ((t * 0.0008 + offset) % 1);
        const pos = curve.getPoint(progress);
        posArr[i * 3] = pos.x;
        posArr[i * 3 + 1] = pos.y;
        posArr[i * 3 + 2] = pos.z;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      const pMat = particlesRef.current.material as THREE.PointsMaterial;
      pMat.opacity = 0.6 + Math.sin(t * 0.006) * 0.2;
    }
  });

  return (
    <group>
      {/* Main beam line */}
      <Line3D ref={lineRef} geometry={lineGeom}>
        <lineBasicMaterial color={color} transparent opacity={0.6} />
      </Line3D>
      <Line3D ref={glowRef} geometry={lineGeom}>
        <lineBasicMaterial color={color} transparent opacity={0.15} />
      </Line3D>
      {/* Flow particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.06} transparent opacity={0.7} sizeAttenuation />
      </points>
    </group>
  );
}
