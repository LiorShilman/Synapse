import AppShell from './components/layout/AppShell';
import { useSimulationLoop } from './hooks/useSimulationLoop';

export default function App() {
  useSimulationLoop();
  return <AppShell />;
}
