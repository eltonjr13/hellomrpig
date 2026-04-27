import type { NPCPosition } from "../../npc/types";
import type { ResourceInventory } from "../resources/types";

export type BuildingType = "hut" | "storage" | "farm" | "well" | "workshop" | "firepit" | "watchtower" | "wall";
export type BuildingStatus = "planned" | "building" | "completed" | "damaged";

export type Building = {
  id: string;
  type: BuildingType;
  position: NPCPosition;
  level: number;
  health: number;
  cost: Partial<ResourceInventory>;
  progress: number;
  status: BuildingStatus;
};

export type Village = {
  id: string;
  societyId: string;
  planetId: string;
  position: NPCPosition;
  level: number;
  population: number;
  buildings: Building[];
  storage: ResourceInventory;
  defense: number;
  growthScore: number;
};
