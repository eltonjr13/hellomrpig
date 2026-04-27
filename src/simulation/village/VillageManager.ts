import type { Society } from "../society/types";
import { emptyInventory } from "../resources/types";
import type { Village } from "./types";
import { chooseNextBuilding } from "./BuildingPlanner";
import { advanceConstruction, canPayCost, createBuilding, payCost } from "./ConstructionSystem";

export class VillageManager {
  update(planetId: string, societies: Society[], villages: Village[], deltaSeconds: number) {
    let nextVillages = [...villages];

    for (const society of societies) {
      let village = nextVillages.find((candidate) => candidate.societyId === society.id);

      if (!village) {
        village = {
          id: `${society.id}-village-1`,
          societyId: society.id,
          planetId,
          position: society.territoryCenter,
          level: 1,
          population: society.members.length,
          buildings: [createBuilding("firepit", {
            id: "temp",
            societyId: society.id,
            planetId,
            position: society.territoryCenter,
            level: 1,
            population: society.members.length,
            buildings: [],
            storage: { ...emptyInventory },
            defense: 0,
            growthScore: 0,
          }, 0)],
          storage: { ...emptyInventory, ...society.resources },
          defense: 0,
          growthScore: 1,
        };
        nextVillages.push(village);
      }

      village = this.updateVillage(society, village, deltaSeconds);
      nextVillages = nextVillages.map((candidate) => (candidate.id === village.id ? village : candidate));
    }

    return nextVillages;
  }

  private updateVillage(society: Society, village: Village, deltaSeconds: number) {
    let nextVillage = {
      ...village,
      population: society.members.length,
      storage: {
        ...village.storage,
        food: village.storage.food + getCompletedCount(village, "farm") * deltaSeconds * 1.6,
        water: village.storage.water + getCompletedCount(village, "well") * deltaSeconds * 1.8,
      },
    };

    nextVillage = advanceConstruction(nextVillage, deltaSeconds);

    const planned = nextVillage.buildings.find((building) => building.status === "planned");
    if (planned && canPayCost(nextVillage.storage, planned.cost)) {
      nextVillage = {
        ...nextVillage,
        storage: payCost(nextVillage.storage, planned.cost),
        buildings: nextVillage.buildings.map((building) =>
          building.id === planned.id ? { ...building, status: "building" as const } : building,
        ),
      };
    }

    if (!nextVillage.buildings.some((building) => building.status !== "completed")) {
      const type = chooseNextBuilding(society, nextVillage);
      if (type) {
        nextVillage = {
          ...nextVillage,
          buildings: [...nextVillage.buildings, createBuilding(type, nextVillage, nextVillage.buildings.length)],
        };
      }
    }

    const completed = nextVillage.buildings.filter((building) => building.status === "completed").length;
    return {
      ...nextVillage,
      level: completed >= 8 ? 4 : completed >= 5 ? 3 : completed >= 2 ? 2 : 1,
    };
  }
}

function getCompletedCount(village: Village, type: Village["buildings"][number]["type"]) {
  return village.buildings.filter((building) => building.type === type && building.status === "completed").length;
}
