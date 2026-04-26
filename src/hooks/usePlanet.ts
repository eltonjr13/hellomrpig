import { useGameStore } from "../store/useGameStore";
import { availablePlanets } from "../world/PlanetManager";

export function usePlanet() {
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const currentWorld = useGameStore((state) => state.currentWorld);
  const setCurrentPlanet = useGameStore((state) => state.setCurrentPlanet);

  return {
    planets: availablePlanets,
    currentPlanet,
    currentWorld,
    selectPlanet: setCurrentPlanet,
  };
}
