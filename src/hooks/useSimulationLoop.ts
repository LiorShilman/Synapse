import { useEffect, useRef } from 'react';
import { executeTick } from '../agents/SimulationEngine';
import { useSimStore } from '../store/useSimStore';

const TICK_INTERVAL = 4000;
const PROBLEM_ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSimulationLoop() {
  const tickRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const problemRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const isApiMode = useSimStore((s) => s.isApiMode);
  const mode = useSimStore((s) => s.mode);
  const isSolving = useSimStore((s) => s.isSolving);
  const simPaused = useSimStore((s) => s.simPaused);

  // Determine if the tick loop should run:
  // - In simulation mode (not API): run unless simPaused (consensus reached)
  // - In API mode + solving + not paused: run with real API
  // - In API mode + not solving: PAUSE (waiting for problem input)
  const shouldRun = isApiMode
    ? (mode === 'solving' && isSolving)
    : !simPaused;

  useEffect(() => {
    if (!shouldRun) {
      clearInterval(tickRef.current);
      clearInterval(problemRef.current);
      return;
    }

    // Start simulation loop
    tickRef.current = setInterval(() => {
      executeTick();
    }, TICK_INTERVAL);

    // Problem rotation (only in simulation mode)
    if (!isApiMode) {
      problemRef.current = setInterval(() => {
        useSimStore.getState().rotateProblem();
      }, PROBLEM_ROTATION_INTERVAL);
    }

    // Fire first tick quickly so UI isn't empty
    setTimeout(() => executeTick(), 500);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(problemRef.current);
    };
  }, [shouldRun, isApiMode]);
}
