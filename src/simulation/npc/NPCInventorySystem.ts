import type { NPC } from "../../npc/types";
import type { MineableResourceType } from "../mining/types";

export interface NPCInventory {
  capacity: number;
  items: Record<MineableResourceType, number>;
}

export class NPCInventorySystem {
  static getLoad(inventory: NPCInventory): number {
    return Object.values(inventory.items).reduce((acc, val) => acc + val, 0);
  }

  static isFull(inventory: NPCInventory): boolean {
    return this.getLoad(inventory) >= inventory.capacity;
  }

  static addItem(inventory: NPCInventory, type: MineableResourceType, amount: number): NPCInventory {
    const nextItems = { ...inventory.items };
    nextItems[type] = (nextItems[type] || 0) + amount;
    return { ...inventory, items: nextItems };
  }

  static clearItems(inventory: NPCInventory): { nextInventory: NPCInventory; itemsRemoved: Record<MineableResourceType, number> } {
    const itemsRemoved = { ...inventory.items };
    const emptyItems = {
      energy: 0,
      matter: 0,
      data: 0,
      crystal: 0,
      signal: 0
    };
    return {
      nextInventory: { ...inventory, items: emptyItems },
      itemsRemoved
    };
  }

  static ensureInventory(npc: any): NPC & { inventory: NPCInventory } {
    if (!npc.inventory) {
      return {
        ...npc,
        inventory: {
          capacity: 18,
          items: {
            energy: 0,
            matter: 0,
            data: 0,
            crystal: 0,
            signal: 0
          }
        }
      };
    }
    return npc;
  }
}
