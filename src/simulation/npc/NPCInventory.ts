import type { NPC } from "../../npc/types";
import type { ResourceInventory, ResourceType } from "../resources/types";
import { emptyInventory, normalizeInventory } from "../resources/types";

export function ensureInventory(npc: NPC): NPC {
  return {
    ...npc,
    inventory: normalizeInventory(npc.inventory),
  };
}

export function addToInventory(npc: NPC, type: ResourceType, amount: number): NPC {
  const inventory = normalizeInventory(npc.inventory);
  return {
    ...npc,
    inventory: {
      ...inventory,
      [type]: inventory[type] + amount,
    },
  };
}

export function clearInventory(npc: NPC): [NPC, ResourceInventory] {
  const inventory = normalizeInventory(npc.inventory);
  return [
    {
      ...npc,
      inventory: { ...emptyInventory },
    },
    inventory,
  ];
}

export function getInventoryLoad(npc: NPC) {
  const inventory = normalizeInventory(npc.inventory ?? emptyInventory);
  return Object.values(inventory).reduce((total, value) => total + value, 0);
}
