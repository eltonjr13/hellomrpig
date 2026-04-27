import type { NPCPosition } from "../../npc/types";

export type ResourceType = "energy" | "data" | "matter" | "signal" | "core";

export type ResourceInventory = Record<ResourceType, number>;

export type ResourceNode = {
  id: string;
  type: ResourceType;
  position: NPCPosition;
  amount: number;
  maxAmount: number;
  regenRate: number;
};

export type EnergyNode = ResourceNode;

export const RESOURCE_TYPES: ResourceType[] = ["energy", "data", "matter", "signal", "core"];

export const emptyInventory: ResourceInventory = {
  energy: 0,
  data: 0,
  matter: 0,
  signal: 0,
  core: 0,
};

export function normalizeInventory(input?: Partial<Record<string, number>> | null): ResourceInventory {
  const source = input ?? {};

  return {
    energy: valueOf(source, "energy") + valueOf(source, "food") * 0.6 + valueOf(source, "water") * 0.7,
    data: valueOf(source, "data"),
    matter:
      valueOf(source, "matter") +
      valueOf(source, "wood") +
      valueOf(source, "stone") +
      valueOf(source, "fiber") * 0.6 +
      valueOf(source, "metal") * 1.5,
    signal: valueOf(source, "signal"),
    core: valueOf(source, "core"),
  };
}

function valueOf(source: Partial<Record<string, number>>, key: string) {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
