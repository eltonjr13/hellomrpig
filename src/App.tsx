import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useState } from "react";
import { MainScene } from "./scenes/MainScene";
import { useGameStore } from "./store/useGameStore";
import styles from "./App.module.css";

export default function App() {
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const npcCount = useGameStore((state) => state.npcs.length);
  const spawnedCount = useGameStore((state) => state.spawnObjects.length);

  const requestPointerLock = useCallback(() => {
    document.body.requestPointerLock?.();
  }, []);

  useEffect(() => {
    const onPointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === document.body);
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    return () => document.removeEventListener("pointerlockchange", onPointerLockChange);
  }, []);

  return (
    <main className={styles.shell} onClick={requestPointerLock}>
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
        <span>{isPointerLocked ? "Mouse locked" : "Click to control"}</span>
      </section>
    </main>
  );
}
