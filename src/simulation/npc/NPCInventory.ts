import type { NPC } from "../../npc/types";
import type { ResourceInventory, ResourceType } from "../resources/types";
import { emptyInventory } from "../resources/types";

export function ensureInventory(npc: NPC): NPC {
  return {
    ...npc,
    inventory: npc.inventory ?? { ...emptyInventory },
  };
}

export function addToInventory(npc: NPC, type: ResourceType, amount: number): NPC {
  const inventory = npc.inventory ?? { ...emptyInventory };
  return {
    ...npc,
    inventory: {
      ...inventory,
      [type]: inventory[type] + amount,
    },
  };
}

export function clearInventory(npc: NPC): [NPC, ResourceInventory] {
  const inventory = npc.inventory ?? { ...emptyInventory };
  return [
    {
      ...npc,
      inventory: { ...emptyInventory },
    },
    inventory,
  ];
}

export function getInventoryLoad(npc: NPC) {
  const inventory = npc.inventory ?? emptyInventory;
  return Object.values(inventory).reduce((total, value) => total + value, 0);
}
