import type { NPC } from "../../npc/types";
import type { MineableNode, MineableResourceType } from "../mining/types";
import type { Society } from "../society/types";
import type { DigitalSettlement } from "../village/types";
import { distance, projectToSphere } from "../resources/ResourceManager";
import { NPCInventorySystem, NPCInventory } from "./NPCInventorySystem";
import { MiningSystem } from "../mining/MiningSystem";

export type NPCJobResult = {
  npcs: NPC[];
  resources: MineableNode[];
  societies: Society[];
  villages: DigitalSettlement[];
};

const miningSystem = new MiningSystem();

export class NPCJobSystem {
  execute(npcs: NPC[], resources: MineableNode[], societies: Society[], settlements: DigitalSettlement[], radius: number): NPCJobResult {
    let nextResources = resources;
    let nextSocieties = societies;
    let nextSettlements = settlements;

    const nextNpcs = npcs.map((rawNpc) => {
      let npc = NPCInventorySystem.ensureInventory(rawNpc);
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
      if (buildTarget && NPCInventorySystem.getLoad(npc.inventory) === 0) {
        // Builder vai para a construção
        // O progresso da construção é atualizado na simulação da vila no momento
        // (no ConstructionQueue ou advanceConstruction). Se quisermos que o NPC avance o progresso aqui,
        // precisaríamos atualizar nextSettlements. Por enquanto apenas viaja para o target.
        return {
          ...npc,
          currentAction: "explore_area" as const,
          targetPosition: projectToSphere(buildTarget.position, radius),
        };
      }

      const inventoryLoad = NPCInventorySystem.getLoad(npc.inventory);
      const isFull = NPCInventorySystem.isFull(npc.inventory);
      const isReturningHome = npc.currentAction === "return_home" && inventoryLoad > 0;

      if (isFull || isReturningHome) {
        if (distance(npc.position, settlement.position) < 3.2) {
          const { nextInventory, itemsRemoved } = NPCInventorySystem.clearItems(npc.inventory);
          npc = {
            ...npc,
            inventory: nextInventory,
            currentAction: "explore_area" as const,
          };
          nextSettlements = nextSettlements.map((candidate) =>
            candidate.id === settlement.id
              ? { ...candidate, storage: addInventory(candidate.storage, itemsRemoved), growthScore: candidate.growthScore + 1 }
              : candidate,
          );
          nextSocieties = nextSocieties.map((candidate) =>
            candidate.id === society.id ? { ...candidate, resources: addInventory(candidate.resources, itemsRemoved) } : candidate,
          );
          return npc;
        } else {
          return {
            ...npc,
            targetPosition: settlement.position,
            currentAction: "return_home" as const,
          };
        }
      }

      // Procurar recursos se não estiver cheio
      const targetType = getTargetResource(npc, settlement);
      const node = nextResources
        .filter((candidate) => candidate.type === targetType && !candidate.isDestroyed && candidate.amount > 0)
        .sort((a, b) => distance(a.position, npc.position) - distance(b.position, npc.position))[0];

      if (!node) return npc;

      if (distance(npc.position, node.position) < 2.8) {
        // Mining action
        const miningPower = npc.societyRole?.type === "miner" ? 15 : 5; // Dano de mineração
        const result = miningSystem.mineNode(nextResources, node.id, miningPower);
        nextResources = result.nodes;
        
        if (result.harvestedAmount > 0) {
          const nextInventory = NPCInventorySystem.addItem(npc.inventory, node.type, result.harvestedAmount);
          return { ...npc, inventory: nextInventory, currentAction: "explore_area" as const };
        }
        return { ...npc, currentAction: "explore_area" as const };
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

function getTargetResource(npc: NPC, settlement: DigitalSettlement): MineableResourceType {
  if (npc.societyRole?.type === "researcher") return "data";
  if (npc.societyRole?.type === "connector") return "signal";
  if (npc.societyRole?.type === "architect") return (settlement.storage.matter ?? 0) < (settlement.storage.energy ?? 0) ? "matter" : "energy";
  
  // Tratamento antigo de 'core' foi transformado em crystal
  if (npc.societyRole?.type === "scout") return (settlement.storage.crystal ?? 0) < 2 ? "crystal" : getNeededResource(settlement);
  
  return getNeededResource(settlement);
}

function getNeededResource(settlement: DigitalSettlement): MineableResourceType {
  const entries = Object.entries(settlement.storage) as Array<[MineableResourceType, number]>;
  if (entries.length === 0) return "energy";
  return entries.sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[0].localeCompare(b[0]);
  })[0][0];
}

function getBuildTarget(npc: NPC, settlement: DigitalSettlement) {
  if (npc.societyRole?.type !== "architect" && npc.societyRole?.type !== "connector" && npc.societyRole?.type !== "builder") return null;
  return settlement.structures.find((structure) => structure.status === "building" || structure.status === "planned") ?? null;
}

function addInventory<T extends Record<string, number>>(target: T, delta: Record<string, number>) {
  const next = { ...target };
  for (const [key, value] of Object.entries(delta)) {
    next[key as keyof T] = ((next[key as keyof T] as number || 0) + value) as T[keyof T];
  }
  return next;
}
