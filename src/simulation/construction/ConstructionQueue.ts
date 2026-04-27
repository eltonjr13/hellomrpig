import type { ResourceInventory } from "../resources/types";
import type { DigitalSettlement, Structure } from "../village/types";
import { BuildCostType } from "./BuildCost";

export class ConstructionQueue {
  canPayCost(storage: ResourceInventory, cost: BuildCostType) {
    return Object.entries(cost).every(
      ([resource, amount]) => (storage[resource as keyof ResourceInventory] ?? 0) >= (amount ?? 0)
    );
  }

  payCost(storage: ResourceInventory, cost: BuildCostType) {
    const next = { ...storage };
    for (const [resource, amount] of Object.entries(cost)) {
      const key = resource as keyof ResourceInventory;
      next[key] = Math.max(0, (next[key] ?? 0) - (amount ?? 0));
    }
    return next;
  }

  processQueue(settlement: DigitalSettlement, deltaSeconds: number): DigitalSettlement {
    let nextSettlement = { ...settlement };
    
    // Check if we can start any planned structure
    const planned = nextSettlement.structures.find((s) => s.status === "planned");
    if (planned && this.canPayCost(nextSettlement.storage, planned.cost as BuildCostType)) {
      nextSettlement.storage = this.payCost(nextSettlement.storage, planned.cost as BuildCostType);
      
      // Transita para hologram / building (depende de como a view vai tratar)
      nextSettlement.structures = nextSettlement.structures.map(s => 
        s.id === planned.id ? { ...s, status: "building" as const } : s
      );
    }

    // Builder role will advance the progress, but if we want some automatic progress, we do it here.
    // The user wants builders to build it, so progress should probably be increased by Builder NPCs.
    // But as a fallback, let's keep the automatic advance.
    
    return nextSettlement;
  }
}
