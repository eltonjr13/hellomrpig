import type { Society } from "../society/types";
import type { BuildingType, Village } from "./types";

export function chooseNextBuilding(society: Society, village: Village): BuildingType | null {
  const completed = new Set(village.buildings.filter((building) => building.status === "completed").map((building) => building.type));
  const planned = new Set(village.buildings.filter((building) => building.status !== "completed").map((building) => building.type));
  const hasOrPlanned = (type: BuildingType) => completed.has(type) || planned.has(type);

  if (!hasOrPlanned("firepit")) return "firepit";
  if (!hasOrPlanned("hut")) return "hut";
  if (village.population >= 3 && !hasOrPlanned("storage")) return "storage";
  if ((village.storage.food < 45 || society.resources.food < 45) && !hasOrPlanned("farm")) return "farm";
  if ((village.storage.water < 35 || society.resources.water < 35) && !hasOrPlanned("well")) return "well";
  if (society.culture.innovation > 58 && !hasOrPlanned("workshop")) return "workshop";
  if (society.dangerLevel > 35 && !hasOrPlanned("watchtower")) return "watchtower";
  if (society.dangerLevel > 55 && !hasOrPlanned("wall")) return "wall";
  return null;
}

export function getBuildingCost(type: BuildingType) {
  if (type === "hut") return { wood: 12, fiber: 6 };
  if (type === "storage") return { wood: 18, stone: 8 };
  if (type === "farm") return { wood: 10, fiber: 10 };
  if (type === "well") return { stone: 18, wood: 6 };
  if (type === "workshop") return { wood: 22, stone: 16, metal: 4 };
  if (type === "watchtower") return { wood: 24, stone: 8, fiber: 8 };
  if (type === "wall") return { stone: 32, wood: 10 };
  return { wood: 8, stone: 2 };
}
