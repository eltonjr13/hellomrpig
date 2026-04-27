import { memo } from "react";
import { useGameStore } from "../../store/useGameStore";
import { useNPCStore } from "../../store/useNPCStore";
import { useWorldSimulationStore } from "../../store/useWorldSimulationStore";
import styles from "./VillageDebugPanel.module.css";

export const VillageDebugPanel = memo(function VillageDebugPanel() {
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const currentWorld = useGameStore((state) => state.currentWorld);
  const settlements = useWorldSimulationStore((state) => state.villages);
  const speedMultiplier = useWorldSimulationStore((state) => state.speedMultiplier);
  const setSpeedMultiplier = useWorldSimulationStore((state) => state.setSpeedMultiplier);
  const spawnResources = useWorldSimulationStore((state) => state.spawnResources);
  const resetSimulation = useWorldSimulationStore((state) => state.resetSimulation);
  const spawnNPC = useNPCStore((state) => state.spawnNPC);
  const settlement = settlements[0];

  return (
    <section className={styles.panel} aria-label="Digital settlement debug">
      <header>
        <strong>Cidade digital</strong>
        <span>{settlement ? `Nivel ${settlement.level}` : "formando"}</span>
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

      {settlement ? (
        <>
          <div className={styles.grid}>
            {Object.entries(settlement.storage).map(([key, value]) => (
              <span key={key}>
                {key}: {Math.floor(value)}
              </span>
            ))}
          </div>
          <div className={styles.queue}>
            {settlement.structures.slice(-5).map((structure) => (
              <small key={structure.id}>
                {structure.type} - {structure.status} - {Math.round(structure.progress)}%
              </small>
            ))}
          </div>
        </>
      ) : (
        <small>Aguardando sociedade criar core_node.</small>
      )}
    </section>
  );
});
