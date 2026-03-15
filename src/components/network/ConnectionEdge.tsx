import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS } from '../../agents/agentDefinitions';
import Line3D from './Line3D';

interface ConnectionEdgeProps {
  fromId: string;
  toId: string;
}

const CURVE_SEGMENTS = 50;
const FLOW_PARTICLE_COUNT = 16;
const ENERGY_PULSE_COUNT = 3;

export default function ConnectionEdge({ fromId, toId }: ConnectionEdgeProps) {
  const lineRef = useRef<THREE.Line>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Line>(null);
  const tubeRef = useRef<THREE.Mesh>(null);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

  const fromAgent = AGENTS.find((a) => a.id === fromId);
  const toAgent = AGENTS.find((a) => a.id === toId);
  const color = fromAgent?.color ?? '#4FC3F7';
  const toColor = toAgent?.color ?? '#4FC3F7';

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
    return new THREE.BufferGeometry().setFromPoints(curvePoints);
  }, [curvePoints]);

  // Tube geometry for the "energy conduit"
  const tubeGeom = useMemo(() => {
    return new THREE.TubeGeometry(curve, CURVE_SEGMENTS, 0.025, 8, false);
  }, [curve]);

  const particlePositions = useMemo(() => new Float32Array(FLOW_PARTICLE_COUNT * 3), []);

  // Gradient color between the two agents
  const midColor = useMemo(() => {
    const c1 = new THREE.Color(color);
    const c2 = new THREE.Color(toColor);
    return new THREE.Color().lerpColors(c1, c2, 0.5);
  }, [color, toColor]);

  useFrame(() => {
    const t = Date.now();

    // Main beam line — bright pulsing
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.6 + Math.sin(t * 0.005) * 0.25;
    }
    // Glow line — wider halo
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 0.004) * 0.12;
    }

    // Energy tube — pulsing conduit
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 0.006) * 0.1;
    }

    // Energy pulse spheres traveling along the curve
    pulseRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const offset = i / ENERGY_PULSE_COUNT;
      const progress = ((t * 0.001 + offset) % 1);
      const pos = curve.getPoint(progress);
      mesh.position.copy(pos);
      const scale = 0.08 + Math.sin(progress * Math.PI) * 0.06;
      mesh.scale.setScalar(scale);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(progress * Math.PI) * 0.4;
    });

    // Flow particles along curve — bright and numerous
    if (particlesRef.current) {
      const posArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < FLOW_PARTICLE_COUNT; i++) {
        const offset = (i / FLOW_PARTICLE_COUNT);
        const progress = ((t * 0.001 + offset) % 1);
        const pos = curve.getPoint(progress);
        // Slight scatter around the line
        posArr[i * 3] = pos.x + (Math.sin(t * 0.01 + i) * 0.02);
        posArr[i * 3 + 1] = pos.y + (Math.cos(t * 0.012 + i) * 0.02);
        posArr[i * 3 + 2] = pos.z + (Math.sin(t * 0.008 + i * 2) * 0.02);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      const pMat = particlesRef.current.material as THREE.PointsMaterial;
      pMat.opacity = 0.7 + Math.sin(t * 0.006) * 0.2;
    }
  });

  return (
    <group>
      {/* Energy tube conduit */}
      <mesh ref={tubeRef} geometry={tubeGeom}>
        <meshBasicMaterial color={midColor} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Main beam line */}
      <Line3D ref={lineRef} geometry={lineGeom}>
        <lineBasicMaterial color={color} transparent opacity={0.7} />
      </Line3D>
      {/* Glow line */}
      <Line3D ref={glowRef} geometry={lineGeom}>
        <lineBasicMaterial color={midColor} transparent opacity={0.25} />
      </Line3D>
      {/* Energy pulse spheres traveling along the beam */}
      {Array.from({ length: ENERGY_PULSE_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { pulseRefs.current[i] = el; }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      {/* Flow particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.08} transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
