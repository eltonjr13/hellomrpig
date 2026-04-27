import { memo } from "react";
import { usePlanet } from "../../hooks/usePlanet";
import type { PlanetType } from "../../world/PlanetManager";
import styles from "./PlanetSelector.module.css";

const typeLabels: Record<PlanetType, string> = {
  organic: "Organico",
  social: "Social",
  ai: "IA",
  hardcore: "Hardcore",
};

export const PlanetSelector = memo(function PlanetSelector() {
  const { planets, currentPlanet, selectPlanet } = usePlanet();

  return (
    <section className={styles.selector} aria-label="Selecionar planeta">
      <div className={styles.header}>
        <span>Mundos</span>
        <strong>{currentPlanet.name}</strong>
      </div>

      <div className={styles.grid}>
        {planets.map((planet) => {
          const isActive = planet.id === currentPlanet.id;

          return (
            <button
              key={planet.id}
              type="button"
              className={styles.planetButton}
              data-active={isActive ? "true" : "false"}
              data-type={planet.type}
              onClick={() => selectPlanet(planet.id)}
              aria-pressed={isActive}
            >
              <span className={styles.orb} aria-hidden="true" />
              <span className={styles.info}>
                <strong>{planet.name}</strong>
                <small>
                  {typeLabels[planet.type]} · R{planet.radius} · {planet.playersOnline} online
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
});
