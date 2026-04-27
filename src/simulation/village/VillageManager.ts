import type { Society } from "../society/types";
import { emptyInventory, normalizeInventory } from "../resources/types";
import type { DigitalSettlement } from "./types";
import { chooseNextStructure } from "./BuildingPlanner";
import { advanceConstruction, canPayCost, connectSettlementPaths, createStructure, payCost } from "./ConstructionSystem";

export class DigitalSettlementManager {
  update(planetId: string, societies: Society[], settlements: DigitalSettlement[], deltaSeconds: number) {
    let nextSettlements = settlements.map((settlement) => normalizeSettlement(settlement, societies.find((society) => society.id === settlement.societyId)));

    for (const society of societies) {
      let settlement = nextSettlements.find((candidate) => candidate.societyId === society.id);

      if (!settlement) {
        const baseSettlement: DigitalSettlement = {
          id: `${society.id}-digital-settlement-1`,
          societyId: society.id,
          planetId,
          position: society.territoryCenter,
          level: 1,
          population: society.members.length,
          structures: [],
          paths: [],
          storage: normalizeInventory({ ...emptyInventory, ...society.resources }),
          defense: 0,
          growthScore: 1,
          neonColor: society.neonColor,
          coreStructureId: null,
          techLevel: society.techLevel,
        };
        settlement = {
          ...baseSettlement,
          structures: [createStructure("core_node", baseSettlement, 0)],
          coreStructureId: `${baseSettlement.id}-core-node`,
        };
        nextSettlements.push(settlement);
      }

      settlement = this.updateSettlement(society, settlement, deltaSeconds);
      nextSettlements = nextSettlements.map((candidate) => (candidate.id === settlement.id ? settlement : candidate));
    }

    return nextSettlements;
  }

  private updateSettlement(society: Society, settlement: DigitalSettlement, deltaSeconds: number) {
    const completedCount = (type: DigitalSettlement["structures"][number]["type"]) =>
      settlement.structures.filter((structure) => structure.type === type && structure.status === "completed").length;

    let nextSettlement = {
      ...settlement,
      population: society.members.length,
      neonColor: society.neonColor,
      techLevel: society.techLevel,
      storage: {
        ...normalizeInventory(settlement.storage),
        energy: normalizeInventory(settlement.storage).energy + completedCount("energy_tower") * deltaSeconds * 2.2,
        data: normalizeInventory(settlement.storage).data + completedCount("data_farm") * deltaSeconds * 1.2,
        signal:
          normalizeInventory(settlement.storage).signal +
          (completedCount("social_hub") * 1.35 + settlement.paths.filter((path) => path.active).length * 0.08) * deltaSeconds,
      },
    };

    nextSettlement = advanceConstruction(nextSettlement, deltaSeconds);

    const planned = nextSettlement.structures.find((structure) => structure.status === "planned");
    if (planned && canPayCost(nextSettlement.storage, planned.cost)) {
      nextSettlement = {
        ...nextSettlement,
        storage: payCost(nextSettlement.storage, planned.cost),
        structures: nextSettlement.structures.map((structure) =>
          structure.id === planned.id ? { ...structure, status: "building" as const } : structure,
        ),
      };
    }

    if (!nextSettlement.structures.some((structure) => structure.status !== "completed")) {
      const type = chooseNextStructure(society, nextSettlement);
      if (type) {
        nextSettlement = {
          ...nextSettlement,
          structures: [...nextSettlement.structures, createStructure(type, nextSettlement, nextSettlement.structures.length)],
        };
      }
    }

    nextSettlement = connectSettlementPaths(nextSettlement);

    const completed = nextSettlement.structures.filter((structure) => structure.status === "completed" && structure.type !== "neon_path").length;
    return {
      ...nextSettlement,
      level: completed >= 8 ? 4 : completed >= 5 ? 3 : completed >= 2 ? 2 : 1,
    };
  }
}

export class VillageManager extends DigitalSettlementManager {}

function normalizeSettlement(settlement: DigitalSettlement, society?: Society): DigitalSettlement {
  const legacy = settlement as DigitalSettlement & { buildings?: DigitalSettlement["structures"] };
  const structures = legacy.structures ?? legacy.buildings ?? [];
  const coreStructure = structures.find((structure) => structure.type === "core_node");

  return {
    ...settlement,
    structures,
    paths: settlement.paths ?? [],
    storage: normalizeInventory(settlement.storage),
    neonColor: settlement.neonColor ?? society?.neonColor ?? "#00e5ff",
    coreStructureId: settlement.coreStructureId ?? coreStructure?.id ?? null,
    techLevel: settlement.techLevel ?? society?.techLevel ?? 1,
  };
}
