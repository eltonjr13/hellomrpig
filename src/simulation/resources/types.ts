import type { NPCPosition } from "../../npc/types";

export type ResourceType = "wood" | "stone" | "food" | "water" | "fiber" | "metal";

export type ResourceInventory = Record<ResourceType, number>;

export type ResourceNode = {
  id: string;
  type: ResourceType;
  position: NPCPosition;
  amount: number;
  maxAmount: number;
  regenRate: number;
};

export const emptyInventory: ResourceInventory = {
  wood: 0,
  stone: 0,
  food: 0,
  water: 0,
  fiber: 0,
  metal: 0,
};
