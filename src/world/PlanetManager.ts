import { createOrganicPlanetWorld } from "./planets/OrganicPlanet";
import { createSocialPlanetWorld } from "./planets/SocialPlanet";
import type { NpcAgent, SpawnObject, Vec3Tuple } from "../store/useGameStore";

export type PlanetType = "organic" | "social" | "ai" | "hardcore";

export type Planet = {
  id: string;
  name: string;
  type: PlanetType;
  seed: number;
  radius: number;
  playersOnline: number;
};

export type PlanetEnvironment = {
  skyColor: string;
  groundColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  sunIntensity: number;
  starCount: number;
};

export type PlanetWorld = {
  instanceKey: string;
  planet: Planet;
  radius: number;
  playableRadius: number;
  spawnPoint: Vec3Tuple;
  spawnRotationY: number;
  spawnObjects: SpawnObject[];
  npcs: NpcAgent[];
  environment: PlanetEnvironment;
};

export const PLANET_STORAGE_KEY = "hellomrpig:selectedPlanetId";

export const availablePlanets: Planet[] = [
  {
    id: "verdantia",
    name: "Verdantia",
    type: "organic",
    seed: 1327,
    radius: 360,
    playersOnline: 8,
  },
  {
    id: "praca-nova",
    name: "Praca Nova",
    type: "social",
    seed: 2419,
    radius: 390,
    playersOnline: 23,
  },
  {
    id: "neuralis",
    name: "Neuralis",
    type: "ai",
    seed: 3901,
    radius: 420,
    playersOnline: 5,
  },
  {
    id: "ferro-zero",
    name: "Ferro Zero",
    type: "hardcore",
    seed: 4877,
    radius: 340,
    playersOnline: 2,
  },
];

const fallbackPlanet = availablePlanets[0];

export function getPlanetById(planetId: string | null | undefined) {
  return availablePlanets.find((planet) => planet.id === planetId) ?? fallbackPlanet;
}

export function getStoredPlanetId() {
  if (typeof window === "undefined") return fallbackPlanet.id;
  return window.localStorage.getItem(PLANET_STORAGE_KEY) ?? fallbackPlanet.id;
}

export function persistPlanetChoice(planetId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLANET_STORAGE_KEY, planetId);
}

export function createPlanetWorld(planetId: string): PlanetWorld {
  const planet = getPlanetById(planetId);

  if (planet.type === "social") {
    return createSocialPlanetWorld(planet);
  }

  return createOrganicPlanetWorld(planet);
}
