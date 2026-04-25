import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MainScene } from "./scenes/MainScene";
import { useGameStore } from "./store/useGameStore";
import styles from "./App.module.css";

export default function App() {
  const npcCount = useGameStore((state) => state.npcs.length);
  const spawnedCount = useGameStore((state) => state.spawnObjects.length);
  const selectedCharacterId = useGameStore((state) => state.selectedCharacterId);
  const selectedCharacterName = selectedCharacterId === "samba" ? "Samba" : "Morador";

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
        <span>Personagem: {selectedCharacterName}</span>
        <span>Habitantes: {npcCount}</span>
        <span>Estruturas: {spawnedCount}</span>
        <span>C para trocar</span>
      </section>
    </main>
  );
}
