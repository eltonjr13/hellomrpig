import { memo } from "react";
import { useGameStore } from "../../store/useGameStore";
import { useNPCStore } from "../../store/useNPCStore";
import { useWorldSimulationStore } from "../../store/useWorldSimulationStore";
import styles from "./VillageDebugPanel.module.css";

export const VillageDebugPanel = memo(function VillageDebugPanel() {
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const currentWorld = useGameStore((state) => state.currentWorld);
  const villages = useWorldSimulationStore((state) => state.villages);
  const speedMultiplier = useWorldSimulationStore((state) => state.speedMultiplier);
  const setSpeedMultiplier = useWorldSimulationStore((state) => state.setSpeedMultiplier);
  const spawnResources = useWorldSimulationStore((state) => state.spawnResources);
  const resetSimulation = useWorldSimulationStore((state) => state.resetSimulation);
  const spawnNPC = useNPCStore((state) => state.spawnNPC);
  const village = villages[0];

  return (
    <section className={styles.panel} aria-label="Village debug">
      <header>
        <strong>Vila</strong>
        <span>{village ? `Nivel ${village.level}` : "formando"}</span>
      </header>

      <div className={styles.actions}>
        <button type="button" onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 4 : 1)}>
          {speedMultiplier === 1 ? "4x" : "1x"}
        </button>
        <button type="button" onClick={() => spawnResources(currentPlanet.id, currentWorld.radius)}>
          Recursos
        </button>
        <button type="button" onClick={() => spawnNPC(currentPlanet.id, currentWorld.radius)}>
          NPC
        </button>
        <button type="button" onClick={() => resetSimulation(currentPlanet.id, currentWorld.radius)}>
          Reset
        </button>
      </div>

      {village ? (
        <>
          <div className={styles.grid}>
            {Object.entries(village.storage).map(([key, value]) => (
              <span key={key}>{key}: {Math.floor(value)}</span>
            ))}
          </div>
          <div className={styles.queue}>
            {village.buildings.slice(-5).map((building) => (
              <small key={building.id}>
                {building.type} · {building.status} · {Math.round(building.progress)}%
              </small>
            ))}
          </div>
        </>
      ) : (
        <small>Aguardando sociedade criar territorio.</small>
      )}
    </section>
  );
});
