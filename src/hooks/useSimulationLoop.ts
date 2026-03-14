import { useEffect, useRef } from 'react';
import { executeTick } from '../agents/SimulationEngine';
import { useSimStore } from '../store/useSimStore';

const TICK_INTERVAL = 4000;
const PROBLEM_ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSimulationLoop() {
  const tickRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const problemRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    // Start simulation loop
    tickRef.current = setInterval(() => {
      executeTick();
    }, TICK_INTERVAL);

    // Problem rotation
    problemRef.current = setInterval(() => {
      useSimStore.getState().rotateProblem();
    }, PROBLEM_ROTATION_INTERVAL);

    // Fire first tick quickly so UI isn't empty
    setTimeout(() => executeTick(), 500);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(problemRef.current);
    };
  }, []);
}
