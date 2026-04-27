import { memo, useState } from "react";
import { availablePlanets } from "../../world/PlanetManager";
import { useGameStore } from "../../store/useGameStore";
import { useNPCStore } from "../../store/useNPCStore";
import { useWorldSimulationStore } from "../../store/useWorldSimulationStore";
import styles from "./SimulationMenu.module.css";

export const SimulationMenu = memo(function SimulationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const currentWorld = useGameStore((state) => state.currentWorld);
  const setCurrentPlanet = useGameStore((state) => state.setCurrentPlanet);
  const npcs = useNPCStore((state) => state.npcs);
  const selectedNpcId = useNPCStore((state) => state.selectedNpcId);
  const selectNPC = useNPCStore((state) => state.selectNPC);
  const spawnNPC = useNPCStore((state) => state.spawnNPC);
  const resources = useWorldSimulationStore((state) => state.resources);
  const societies = useWorldSimulationStore((state) => state.societies);
  const villages = useWorldSimulationStore((state) => state.villages);
  const speedMultiplier = useWorldSimulationStore((state) => state.speedMultiplier);
  const setSpeedMultiplier = useWorldSimulationStore((state) => state.setSpeedMultiplier);
  const spawnResources = useWorldSimulationStore((state) => state.spawnResources);
  const resetSimulation = useWorldSimulationStore((state) => state.resetSimulation);
  const npc = npcs.find((candidate) => candidate.id === selectedNpcId) ?? npcs[0];
  const society = societies[0];
  const settlement = villages[0];

  return (
    <>
      <button type="button" className={styles.toggle} onClick={() => setIsOpen((value) => !value)}>
        Simulacao
      </button>

      {isOpen ? (
        <aside className={styles.menu} aria-label="Menu de simulacao">
          <header className={styles.header}>
            <div>
              <span>Planeta</span>
              <strong>{currentPlanet.name}</strong>
            </div>
            <button type="button" onClick={() => setIsOpen(false)}>
              Fechar
            </button>
          </header>

          <section className={styles.section}>
            <h2>Mundos</h2>
            <div className={styles.planetGrid}>
              {availablePlanets.map((planet) => (
                <button
                  key={planet.id}
                  type="button"
                  data-active={planet.id === currentPlanet.id ? "true" : "false"}
                  onClick={() => setCurrentPlanet(planet.id)}
                >
                  <strong>{planet.name}</strong>
                  <small>
                    {planet.type} - R{planet.radius}
                  </small>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Ajustes</h2>
            <div className={styles.actions}>
              <button type="button" onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 4 : 1)}>
                Velocidade {speedMultiplier === 1 ? "4x" : "1x"}
              </button>
              <button type="button" onClick={() => spawnResources(currentPlanet.id, currentWorld.radius)}>
                Spawn recursos
              </button>
              <button type="button" onClick={() => spawnNPC(currentPlanet.id, currentWorld.radius)}>
                Spawn NPC
              </button>
              <button type="button" onClick={() => resetSimulation(currentPlanet.id, currentWorld.radius)}>
                Reset
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Sociedade</h2>
            <div className={styles.statGrid}>
              <span>Sociedade</span>
              <strong>{society?.name ?? "formando"}</strong>
              <span>Lider</span>
              <strong>{npcs.find((candidate) => candidate.id === society?.leaderId)?.name ?? "nenhum"}</strong>
              <span>Recursos</span>
              <strong>{resources.length}</strong>
              <span>Cidade</span>
              <strong>{settlement ? `nivel ${settlement.level}` : "sem core"}</strong>
            </div>
          </section>

          {settlement ? (
            <section className={styles.section}>
              <h2>Storage digital</h2>
              <div className={styles.resourceGrid}>
                {Object.entries(settlement.storage).map(([key, value]) => (
                  <span key={key}>
                    {key}: {Math.floor(value)}
                  </span>
                ))}
              </div>
              <div className={styles.list}>
                {settlement.structures.slice(-4).map((structure) => (
                  <small key={structure.id}>
                    {structure.type} - {structure.status} - {Math.round(structure.progress)}%
                  </small>
                ))}
              </div>
            </section>
          ) : null}

          {npc ? (
            <section className={styles.section}>
              <h2>NPC</h2>
              <select value={npc.id} onChange={(event) => selectNPC(event.target.value)}>
                {npcs.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
              <div className={styles.statGrid}>
                <span>Humor</span>
                <strong>{npc.mood.current}</strong>
                <span>Funcao</span>
                <strong>{npc.societyRole?.type ?? "wanderer"}</strong>
                <span>Acao</span>
                <strong>{npc.currentAction}</strong>
              </div>
            </section>
          ) : null}
        </aside>
      ) : null}
    </>
  );
});
