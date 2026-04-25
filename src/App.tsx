import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MainScene } from "./scenes/MainScene";
import { useGameStore } from "./store/useGameStore";
import styles from "./App.module.css";

export default function App() {
  const npcCount = useGameStore((state) => state.npcs.length);
  const spawnedCount = useGameStore((state) => state.spawnObjects.length);

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
        <strong>3D AI World</strong>
        <span>NPCs: {npcCount}</span>
        <span>Objects: {spawnedCount}</span>
        <span>Scroll to zoom</span>
      </section>
    </main>
  );
}
