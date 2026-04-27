import type { Planet } from "../PlanetManager";
import { getPlanetSurfacePosition } from "./planetGeometry";
import type { SpawnObject } from "../../store/useGameStore";

export type ProceduralPlanetConfig = {
  chunkSize: number;
  chunkRadius: number;
  objectDensity: number;
  treeColor: string;
  rockColor: string;
  fieldColor: string;
  pathColor: string;
  accentColor: string;
};

export function generatePlanetTerrain(planet: Planet, config: ProceduralPlanetConfig): SpawnObject[] {
  const objects: SpawnObject[] = [];
  const centerBuffer = config.chunkSize * 0.45;

  for (let chunkX = -config.chunkRadius; chunkX <= config.chunkRadius; chunkX += 1) {
    for (let chunkZ = -config.chunkRadius; chunkZ <= config.chunkRadius; chunkZ += 1) {
      const chunkDistance = Math.sqrt(chunkX * chunkX + chunkZ * chunkZ);
      if (chunkDistance > config.chunkRadius + 0.35) continue;

      const count = Math.max(1, Math.floor(config.objectDensity + seededRange(planet.seed, chunkX, chunkZ, 1, 0, 3)));

      for (let index = 0; index < count; index += 1) {
        const x = chunkX * config.chunkSize + seededRange(planet.seed, chunkX, chunkZ, index * 5 + 2, -0.42, 0.42) * config.chunkSize;
        const z = chunkZ * config.chunkSize + seededRange(planet.seed, chunkX, chunkZ, index * 5 + 3, -0.42, 0.42) * config.chunkSize;
        const distanceFromSpawn = Math.sqrt(x * x + z * z);

        if (distanceFromSpawn < centerBuffer || distanceFromSpawn > planet.radius * 0.68) continue;

        const roll = seededRange(planet.seed, chunkX, chunkZ, index * 5 + 4, 0, 1);
        objects.push(createProceduralObject(planet, config, x, z, roll, chunkX, chunkZ, index));
      }
    }
  }

  return objects;
}

function createProceduralObject(
  planet: Planet,
  config: ProceduralPlanetConfig,
  x: number,
  z: number,
  roll: number,
  chunkX: number,
  chunkZ: number,
  index: number,
): SpawnObject {
  const id = `${planet.id}-chunk-${chunkX}-${chunkZ}-${index}`;
  const rotationY = seededRange(planet.seed, chunkX, chunkZ, index + 10, -Math.PI, Math.PI);

  if (planet.type === "social" && roll > 0.72) {
    return {
      id,
      type: "storage",
      position: getPlanetSurfacePosition(planet.radius, x, z, 0.55),
      color: config.accentColor,
      scale: [1.15, 1.1, 1.15],
      rotationY,
    };
  }

  if (roll > 0.78) {
    return {
      id,
      type: "rock",
      position: getPlanetSurfacePosition(planet.radius, x, z, 0.28),
      color: config.rockColor,
      scale: seededRange(planet.seed, chunkX, chunkZ, index + 20, 0.75, 1.45),
      rotationY,
    };
  }

  if (roll > 0.58) {
    return {
      id,
      type: "field",
      position: getPlanetSurfacePosition(planet.radius, x, z, 0.035),
      color: config.fieldColor,
      scale: [
        seededRange(planet.seed, chunkX, chunkZ, index + 30, 2.2, 5.2),
        0.08,
        seededRange(planet.seed, chunkX, chunkZ, index + 31, 1.8, 4.6),
      ],
      rotationY,
      collision: false,
    };
  }

  if (roll > 0.5) {
    return {
      id,
      type: "path",
      position: getPlanetSurfacePosition(planet.radius, x, z, 0.015),
      color: config.pathColor,
      scale: [
        seededRange(planet.seed, chunkX, chunkZ, index + 40, 1.2, 3.8),
        0.03,
        seededRange(planet.seed, chunkX, chunkZ, index + 41, 2.4, 6.5),
      ],
      rotationY,
      collision: false,
    };
  }

  return {
    id,
    type: "tree",
    position: getPlanetSurfacePosition(planet.radius, x, z, 0),
    color: config.treeColor,
    scale: seededRange(planet.seed, chunkX, chunkZ, index + 50, 0.85, 1.85),
    rotationY,
  };
}

function seededRange(seed: number, a: number, b: number, c: number, min: number, max: number) {
  const value = Math.sin(seed * 12.9898 + a * 78.233 + b * 37.719 + c * 19.19) * 43758.5453;
  const normalized = value - Math.floor(value);

  return min + normalized * (max - min);
}
