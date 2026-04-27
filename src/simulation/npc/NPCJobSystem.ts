import type { NPC } from "../../npc/types";
import type { ResourceNode, ResourceType } from "../resources/types";
import type { Society } from "../society/types";
import type { DigitalSettlement } from "../village/types";
import { distance, projectToSphere } from "../resources/ResourceManager";
import { addToInventory, clearInventory, ensureInventory, getInventoryLoad } from "./NPCInventory";

export type NPCJobResult = {
  npcs: NPC[];
  resources: ResourceNode[];
  societies: Society[];
  villages: DigitalSettlement[];
};

const CARRY_LIMIT = 18;

export class NPCJobSystem {
  execute(npcs: NPC[], resources: ResourceNode[], societies: Society[], settlements: DigitalSettlement[], radius: number): NPCJobResult {
    let nextResources = resources;
    let nextSocieties = societies;
    let nextSettlements = settlements;

    const nextNpcs = npcs.map((rawNpc) => {
      let npc = ensureInventory(rawNpc);
      const society = nextSocieties.find((candidate) => candidate.id === npc.societyId);
      const settlement = society ? nextSettlements.find((candidate) => candidate.societyId === society.id) : null;
      if (!society || !settlement) return npc;

      if (npc.societyRole?.type === "guardian") {
        return {
          ...npc,
          currentAction: "protect" as const,
          targetPosition: settlement.position,
        };
      }

      const buildTarget = getBuildTarget(npc, settlement);
      if (buildTarget && getInventoryLoad(npc) === 0) {
        return {
          ...npc,
          currentAction: "explore_area" as const,
          targetPosition: projectToSphere(buildTarget.position, radius),
        };
      }

      const inventoryLoad = getInventoryLoad(npc);
      if (inventoryLoad > 0 && (inventoryLoad >= CARRY_LIMIT || distance(npc.position, settlement.position) < 3.2)) {
        const [emptyNpc, delivered] = clearInventory(npc);
        npc = {
          ...emptyNpc,
          targetPosition: settlement.position,
          currentAction: "return_home" as const,
        };
        nextSettlements = nextSettlements.map((candidate) =>
          candidate.id === settlement.id
            ? { ...candidate, storage: addInventory(candidate.storage, delivered), growthScore: candidate.growthScore + 1 }
            : candidate,
        );
        nextSocieties = nextSocieties.map((candidate) =>
          candidate.id === society.id ? { ...candidate, resources: addInventory(candidate.resources, delivered) } : candidate,
        );
        return npc;
      }

      const targetType = getTargetResource(npc, settlement);
      const node = nextResources
        .filter((candidate) => candidate.type === targetType && candidate.amount > 1)
        .sort((a, b) => distance(a.position, npc.position) - distance(b.position, npc.position))[0];

      if (!node) return npc;

      if (distance(npc.position, node.position) < 2.8) {
        const amount = Math.min(6, node.amount, CARRY_LIMIT - getInventoryLoad(npc));
        nextResources = nextResources.map((candidate) =>
          candidate.id === node.id ? { ...candidate, amount: candidate.amount - amount } : candidate,
        );
        return addToInventory({ ...npc, currentAction: "explore_area" as const }, node.type, amount);
      }

      return {
        ...npc,
        currentAction: "explore_area" as const,
        targetPosition: projectToSphere(node.position, radius),
      };
    });

    return { npcs: nextNpcs, resources: nextResources, societies: nextSocieties, villages: nextSettlements };
  }
}

function getTargetResource(npc: NPC, settlement: DigitalSettlement): ResourceType {
  if (npc.societyRole?.type === "researcher") return "data";
  if (npc.societyRole?.type === "connector") return "signal";
  if (npc.societyRole?.type === "architect") return settlement.storage.matter < settlement.storage.energy ? "matter" : "energy";
  if (npc.societyRole?.type === "scout") return settlement.storage.core < 2 ? "core" : getNeededResource(settlement);
  return getNeededResource(settlement);
}

function getNeededResource(settlement: DigitalSettlement): ResourceType {
  const entries = Object.entries(settlement.storage) as Array<[ResourceType, number]>;
  return entries.sort((a, b) => a[1] - b[1])[0][0];
}

function getBuildTarget(npc: NPC, settlement: DigitalSettlement) {
  if (npc.societyRole?.type !== "architect" && npc.societyRole?.type !== "connector") return null;
  return settlement.structures.find((structure) => structure.status === "building") ?? null;
}

function addInventory<T extends Record<string, number>>(target: T, delta: Record<string, number>) {
  const next = { ...target };
  for (const [key, value] of Object.entries(delta)) {
    next[key as keyof T] = ((next[key as keyof T] as number) + value) as T[keyof T];
  }
  return next;
}
