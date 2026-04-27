import type { Society } from "../society/types";
import type { DigitalSettlement, StructureType } from "../village/types";
import type { MineableNode } from "../mining/types";
import { findValidBuildPosition } from "./BuildPlacement";
import { getBuildCost, getBuildWorkRequired } from "./BuildCost";

export class ArchitectSystem {
  planNextStructure(
    society: Society,
    settlement: DigitalSettlement,
    nodes: MineableNode[],
    radius: number
  ) {
    // Verificar se já existe algo planejado
    if (settlement.structures.some(s => s.status === "planned" || s.status === "building")) {
      return null;
    }

    const type = this.chooseNextStructure(society, settlement);
    if (!type) return null;

    const position = findValidBuildPosition(type, settlement.position, settlement.structures, nodes, radius);
    
    // Find connection (simplificado)
    const completed = settlement.structures.filter(s => s.status === "completed" && s.type !== "neon_path");
    const connectedToId = completed.length > 0 ? completed[0].id : null;

    const newStructure = {
      id: `${settlement.id}-${type}-${Date.now()}`,
      type,
      position,
      level: 1,
      health: 100,
      cost: getBuildCost(type),
      requiredWork: getBuildWorkRequired(type),
      progress: 0,
      status: "planned" as const,
      connectedToId,
      importance: 50,
    };

    return newStructure;
  }

  private chooseNextStructure(society: Society, settlement: DigitalSettlement): StructureType | null {
    const populationLimit = settlement.structures.filter(s => s.type === "habitation_pod").length * 5 + 5;
    
    // Construction priorities logic
    if (society.resources.energy < 40 && this.countType(settlement, "energy_tower") < 3) {
      return "energy_tower";
    }
    if (society.members.length >= populationLimit) {
      return "habitation_pod";
    }
    if (society.resources.data < 30 && this.countType(settlement, "data_farm") < 3) {
      return "data_farm";
    }
    if (society.techLevel < 2 && this.countType(settlement, "logic_lab") === 0) {
      return "logic_lab";
    }
    if (society.stability < 50 && this.countType(settlement, "social_hub") === 0) {
      return "social_hub";
    }
    if (society.dangerLevel > 60 && this.countType(settlement, "shield_gate") === 0) {
      return "shield_gate";
    }

    // Default fallback
    if (Math.random() > 0.5) {
      return "energy_tower";
    }
    return "data_farm";
  }

  private countType(settlement: DigitalSettlement, type: StructureType) {
    return settlement.structures.filter(s => s.type === type).length;
  }
}
