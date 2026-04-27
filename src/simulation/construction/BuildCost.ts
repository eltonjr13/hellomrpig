import type { StructureType } from "../village/types";
import type { MineableResourceType } from "../mining/types";

export type BuildCostType = Partial<Record<MineableResourceType, number>>;

export function getBuildCost(type: StructureType): BuildCostType {
  switch (type) {
    case "core_node":
      return { energy: 10, matter: 10, data: 5 };
    case "energy_tower":
      return { energy: 5, matter: 15, crystal: 1 };
    case "data_farm":
      return { energy: 10, data: 20, matter: 5 };
    case "habitation_pod":
      return { matter: 20, energy: 5 };
    case "logic_lab":
      return { data: 25, crystal: 2, energy: 10 };
    case "social_hub":
      return { matter: 15, energy: 15, signal: 10 };
    case "shield_gate":
      return { matter: 30, energy: 20, crystal: 3 };
    case "memory_archive":
      return { data: 40, crystal: 5 };
    case "neon_path":
      return { energy: 2, matter: 1 };
    default:
      return {};
  }
}

export function getBuildWorkRequired(type: StructureType): number {
  switch (type) {
    case "core_node": return 100;
    case "energy_tower": return 80;
    case "data_farm": return 120;
    case "habitation_pod": return 60;
    case "logic_lab": return 150;
    case "social_hub": return 100;
    case "shield_gate": return 200;
    case "memory_archive": return 250;
    case "neon_path": return 20;
    default: return 50;
  }
}
