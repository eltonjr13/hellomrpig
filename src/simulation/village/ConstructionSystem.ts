import type { ResourceInventory } from "../resources/types";
import type { Building, BuildingType, Village } from "./types";
import { getBuildingCost } from "./BuildingPlanner";

export function createBuilding(type: BuildingType, village: Village, index: number): Building {
  const angle = index * 1.72;
  const radius = 5 + index * 1.8;

  return {
    id: `${village.id}-${type}-${Date.now()}`,
    type,
    position: {
      x: village.position.x + Math.cos(angle) * radius,
      y: village.position.y,
      z: village.position.z + Math.sin(angle) * radius,
    },
    level: 1,
    health: 100,
    cost: getBuildingCost(type),
    progress: 0,
    status: "planned",
  };
}

export function canPayCost(storage: ResourceInventory, cost: Partial<ResourceInventory>) {
  return Object.entries(cost).every(([resource, amount]) => storage[resource as keyof ResourceInventory] >= (amount ?? 0));
}

export function payCost(storage: ResourceInventory, cost: Partial<ResourceInventory>) {
  const next = { ...storage };
  for (const [resource, amount] of Object.entries(cost)) {
    const key = resource as keyof ResourceInventory;
    next[key] -= amount ?? 0;
  }
  return next;
}

export function advanceConstruction(village: Village, deltaSeconds: number) {
  let changed = false;
  const buildings = village.buildings.map((building) => {
    if (building.status !== "building") return building;
    changed = true;
    const progress = Math.min(100, building.progress + deltaSeconds * getBuildSpeed(village));
    return {
      ...building,
      progress,
      status: progress >= 100 ? "completed" as const : "building" as const,
    };
  });

  if (!changed) return village;

  return {
    ...village,
    buildings,
    defense: buildings.filter((building) => building.status === "completed" && (building.type === "watchtower" || building.type === "wall")).length * 18,
    growthScore: village.growthScore + buildings.filter((building) => building.status === "completed").length * 0.2,
  };
}

function getBuildSpeed(village: Village) {
  const hasWorkshop = village.buildings.some((building) => building.type === "workshop" && building.status === "completed");
  return hasWorkshop ? 18 : 10;
}
