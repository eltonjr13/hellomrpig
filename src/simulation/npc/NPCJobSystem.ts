import type { NPC } from "../../npc/types";
import type { ResourceNode } from "../resources/types";
import type { Society } from "../society/types";
import type { Village } from "../village/types";
import { distance, projectToSphere } from "../resources/ResourceManager";
import { addToInventory, clearInventory, ensureInventory, getInventoryLoad } from "./NPCInventory";

export type NPCJobResult = {
  npcs: NPC[];
  resources: ResourceNode[];
  societies: Society[];
  villages: Village[];
};

const CARRY_LIMIT = 18;

export class NPCJobSystem {
  execute(npcs: NPC[], resources: ResourceNode[], societies: Society[], villages: Village[], radius: number): NPCJobResult {
    let nextResources = resources;
    let nextSocieties = societies;
    let nextVillages = villages;

    const nextNpcs = npcs.map((rawNpc) => {
      let npc = ensureInventory(rawNpc);
      const society = nextSocieties.find((candidate) => candidate.id === npc.societyId);
      const village = society ? nextVillages.find((candidate) => candidate.societyId === society.id) : null;
      if (!society || !village) return npc;

      if (getInventoryLoad(npc) >= CARRY_LIMIT || distance(npc.position, village.position) < 3.2) {
        const [emptyNpc, delivered] = clearInventory(npc);
        npc = {
          ...emptyNpc,
          targetPosition: village.position,
          currentAction: "return_home" as const,
        };
        nextVillages = nextVillages.map((candidate) =>
          candidate.id === village.id
            ? { ...candidate, storage: addInventory(candidate.storage, delivered), growthScore: candidate.growthScore + 1 }
            : candidate,
        );
        nextSocieties = nextSocieties.map((candidate) =>
          candidate.id === society.id ? { ...candidate, resources: addInventory(candidate.resources, delivered) } : candidate,
        );
        return npc;
      }

      const targetType = getNeededResource(village);
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

    return { npcs: nextNpcs, resources: nextResources, societies: nextSocieties, villages: nextVillages };
  }
}

function getNeededResource(village: Village) {
  const entries = Object.entries(village.storage) as Array<[keyof Village["storage"], number]>;
  return entries.sort((a, b) => a[1] - b[1])[0][0];
}

function addInventory<T extends Record<string, number>>(target: T, delta: Record<string, number>) {
  const next = { ...target };
  for (const [key, value] of Object.entries(delta)) {
    next[key as keyof T] = ((next[key as keyof T] as number) + value) as T[keyof T];
  }
  return next;
}
