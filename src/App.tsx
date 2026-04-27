import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { SimulationMenu } from "./components/ui/SimulationMenu";
import { MainScene } from "./scenes/MainScene";
import { useGameStore } from "./store/useGameStore";
import { useNPCStore } from "./store/useNPCStore";
import styles from "./App.module.css";

export default function App() {
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const npcCount = useNPCStore((state) => state.npcs.length);
  const vehicleMode = useGameStore((state) => state.vehicleMode);
  const vehicleModeLabel = vehicleMode === "airplane" ? "Aviao" : "A pe";

  return (
    <main className={styles.shell}>
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 60, near: 0.1, far: 900 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className={styles.canvas}
      >
        <Suspense fallback={null}>
          <MainScene />
        </Suspense>
      </Canvas>

      <section className={styles.hud} aria-label="Game status">
        <strong>Village Simulation</strong>
        <span>Planeta: {currentPlanet.name}</span>
        <span>Modo: {vehicleModeLabel}</span>
        <span>Habitantes: {npcCount}</span>
      </section>

      <SimulationMenu />
    </main>
  );
}
