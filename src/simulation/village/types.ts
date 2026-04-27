import type { NPCPosition } from "../../npc/types";
import type { ResourceInventory } from "../resources/types";

export type StructureType =
  | "core_node"
  | "habitation_pod"
  | "energy_tower"
  | "data_farm"
  | "logic_lab"
  | "social_hub"
  | "shield_gate"
  | "neon_path"
  | "memory_archive";

export type StructureStatus = "planned" | "building" | "completed" | "damaged";

export type Structure = {
  id: string;
  type: StructureType;
  position: NPCPosition;
  level: number;
  health: number;
  cost: Partial<ResourceInventory>;
  progress: number;
  status: StructureStatus;
  connectedToId: string | null;
  importance: number;
};

export type NeonPath = {
  id: string;
  fromStructureId: string;
  toStructureId: string;
  from: NPCPosition;
  to: NPCPosition;
  color: string;
  active: boolean;
};

export type DigitalSettlement = {
  id: string;
  societyId: string;
  planetId: string;
  position: NPCPosition;
  level: number;
  population: number;
  structures: Structure[];
  paths: NeonPath[];
  storage: ResourceInventory;
  defense: number;
  growthScore: number;
  neonColor: string;
  coreStructureId: string | null;
  techLevel: number;
};

export type BuildingType = StructureType;
export type BuildingStatus = StructureStatus;
export type Building = Structure;
export type Village = DigitalSettlement;
