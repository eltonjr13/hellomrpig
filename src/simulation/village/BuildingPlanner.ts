import type { Society } from "../society/types";
import type { DigitalSettlement, StructureType } from "./types";
import { distance } from "../resources/ResourceManager";

export function chooseNextStructure(society: Society, settlement: DigitalSettlement): StructureType | null {
  const completed = settlement.structures.filter((structure) => structure.status === "completed");
  const active = settlement.structures.filter((structure) => structure.status !== "completed");
  const hasOrPlanned = (type: StructureType) =>
    completed.some((structure) => structure.type === type) || active.some((structure) => structure.type === type);
  const countCompleted = (type: StructureType) => completed.filter((structure) => structure.type === type).length;
  const countAll = (type: StructureType) => settlement.structures.filter((structure) => structure.type === type).length;
  const populationCapacity = 3 + countCompleted("habitation_pod") * 4;

  if (!hasOrPlanned("core_node")) return "core_node";
  if ((settlement.storage.energy < 42 || society.resources.energy < 42) && countAll("energy_tower") < 3) return "energy_tower";
  if (settlement.population >= populationCapacity && countAll("habitation_pod") < 8) return "habitation_pod";
  if ((settlement.storage.data < 34 || society.resources.data < 34) && countAll("data_farm") < 3) return "data_farm";
  if ((society.culture.innovation < 54 || society.techLevel < 3) && !hasOrPlanned("logic_lab")) return "logic_lab";
  if (society.culture.cooperation < 54 && !hasOrPlanned("social_hub")) return "social_hub";
  if (society.dangerLevel > 34 && countAll("shield_gate") < 2) return "shield_gate";
  if (hasDisconnectedCompletedStructures(settlement) && countAll("neon_path") < settlement.structures.length) return "neon_path";
  if (getLongPathCount(settlement) > countAll("neon_path")) return "neon_path";
  if (settlement.storage.signal < 30 && countAll("social_hub") < 2) return "social_hub";
  if (society.techLevel >= 3 && !hasOrPlanned("memory_archive")) return "memory_archive";
  if (countCompleted("energy_tower") < Math.ceil(settlement.population / 5)) return "energy_tower";
  if (countCompleted("data_farm") < Math.ceil(society.techLevel / 3)) return "data_farm";
  return null;
}

export function getStructureCost(type: StructureType) {
  if (type === "core_node") return { energy: 20, matter: 18, data: 6, crystal: 1 };
  if (type === "habitation_pod") return { energy: 10, matter: 16, signal: 4 };
  if (type === "energy_tower") return { energy: 8, matter: 14, data: 4 };
  if (type === "data_farm") return { energy: 14, matter: 12, data: 8 };
  if (type === "logic_lab") return { energy: 18, matter: 18, data: 18, signal: 6 };
  if (type === "social_hub") return { energy: 12, matter: 14, signal: 18 };
  if (type === "shield_gate") return { energy: 24, matter: 20, signal: 10 };
  if (type === "memory_archive") return { energy: 18, matter: 18, data: 28, crystal: 1 };
  return { energy: 4, matter: 4, signal: 8 };
}

export function getStructureImportance(type: StructureType) {
  if (type === "core_node") return 100;
  if (type === "logic_lab" || type === "memory_archive") return 82;
  if (type === "social_hub" || type === "energy_tower") return 72;
  if (type === "shield_gate") return 65;
  if (type === "data_farm") return 58;
  if (type === "habitation_pod") return 48;
  return 30;
}

export function chooseNextBuilding(society: Society, settlement: DigitalSettlement) {
  return chooseNextStructure(society, settlement);
}

export function getBuildingCost(type: StructureType) {
  return getStructureCost(type);
}

function hasDisconnectedCompletedStructures(settlement: DigitalSettlement) {
  const completed = settlement.structures.filter((structure) => structure.status === "completed" && structure.type !== "neon_path");
  if (completed.length <= 1) return false;

  return completed.some((structure) => {
    if (structure.id === settlement.coreStructureId) return false;
    return !settlement.paths.some((path) => path.toStructureId === structure.id || path.fromStructureId === structure.id);
  });
}

function getLongPathCount(settlement: DigitalSettlement) {
  return settlement.paths.filter((path) => distance(path.from, path.to) > 8).length;
}
