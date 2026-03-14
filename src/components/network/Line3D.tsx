import { forwardRef } from 'react';
import * as THREE from 'three';

/**
 * Wrapper around R3F's <line> element to avoid TypeScript conflict
 * with SVG's <line> element in React 19.
 */
const Line3D = forwardRef<THREE.Line, { geometry?: THREE.BufferGeometry; children?: React.ReactNode } & Record<string, unknown>>(
  (props, ref) => {
    // @ts-expect-error: R3F <line> conflicts with SVG line type in React 19
    return <line ref={ref} {...props} />;
  }
);

Line3D.displayName = 'Line3D';
export default Line3D;
