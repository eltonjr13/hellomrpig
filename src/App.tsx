import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { PlanetSelector } from "./components/ui/PlanetSelector";
import { MainScene } from "./scenes/MainScene";
import { useGameStore } from "./store/useGameStore";
import styles from "./App.module.css";

export default function App() {
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const npcCount = useGameStore((state) => state.npcs.length);
  const spawnedCount = useGameStore((state) => state.spawnObjects.length);
  const selectedCharacterId = useGameStore((state) => state.selectedCharacterId);
  const vehicleMode = useGameStore((state) => state.vehicleMode);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const selectedCharacterName = selectedCharacterId === "samba" ? "Samba" : "Morador";
  const vehicleModeLabel = vehicleMode === "airplane" ? "Aviao" : "A pe";
  const cameraModeLabel = cameraMode === "firstPerson" ? "1a pessoa" : "3a pessoa";

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
        <span>Personagem: {selectedCharacterName}</span>
        <span>Modo: {vehicleModeLabel}</span>
        <span>Camera: {cameraModeLabel}</span>
        <span>Habitantes: {npcCount}</span>
        <span>Estruturas: {spawnedCount}</span>
        <span>F aviao / Shift turbo / Ctrl desce</span>
      </section>

      <PlanetSelector />
    </main>
  );
}
