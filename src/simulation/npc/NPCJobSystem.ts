import type { NPC } from "../../npc/types";
import type { MineableNode, MineableResourceType } from "../mining/types";
import type { ResourceInventory } from "../resources/types";
import type { Society } from "../society/types";
import type { DigitalSettlement, Structure } from "../village/types";
import { distance, hash, projectToSphere } from "../resources/ResourceManager";
import { connectSettlementPaths } from "../village/ConstructionSystem";
import { NPCInventorySystem } from "./NPCInventorySystem";
import { MiningSystem } from "../mining/MiningSystem";

export type NPCJobResult = {
  npcs: NPC[];
  resources: MineableNode[];
  societies: Society[];
  villages: DigitalSettlement[];
};

const miningSystem = new MiningSystem();
const BUILD_SITE_DISTANCE = 2.9;
const WORKER_STAND_DISTANCE = 1.65;

export class NPCJobSystem {
  execute(
    npcs: NPC[],
    resources: MineableNode[],
    societies: Society[],
    settlements: DigitalSettlement[],
    radius: number,
    deltaSeconds = 1,
  ): NPCJobResult {
    let nextResources = resources;
    let nextSocieties = societies;
    let nextSettlements = clearConstructionWorkers(settlements);

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

      const inventoryLoad = NPCInventorySystem.getLoad(npc.inventory);
      const buildTarget = getBuildTarget(npc, settlement);
      if (buildTarget && inventoryLoad === 0) {
        const targetPosition = getConstructionStandPosition(buildTarget, npc.id, radius);

        if (distance(npc.position, buildTarget.position) <= BUILD_SITE_DISTANCE) {
          const workAmount = getConstructionWorkAmount(npc, settlement, deltaSeconds);
          nextSettlements = applyConstructionWork(nextSettlements, settlement.id, buildTarget.id, npc.id, workAmount);

          return {
            ...npc,
            currentAction: "build_structure" as const,
            targetPosition,
            needs: {
              ...npc.needs,
              energy: clampNeed(npc.needs.energy - deltaSeconds * 0.9),
              purpose: clampNeed(npc.needs.purpose + deltaSeconds * 2.4),
            },
          };
        }

        return {
          ...npc,
          currentAction: "build_structure" as const,
          targetPosition,
        };
      }

      const isFull = NPCInventorySystem.isFull(npc.inventory);
      const isReturningHome = npc.currentAction === "return_home" && inventoryLoad > 0;
      const shouldDeliverConstructionLoad = inventoryLoad > 0 && isConstructionWorker(npc) && hasPendingConstructionNeed(settlement);

      if (isFull || isReturningHome || shouldDeliverConstructionLoad) {
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
        }

        return {
          ...npc,
          targetPosition: settlement.position,
          currentAction: "return_home" as const,
        };
      }

      const targetType = getTargetResource(npc, settlement);
      const node = nextResources
        .filter((candidate) => !candidate.isDestroyed && candidate.amount > 0)
        .sort((a, b) => {
          const distA = distance(a.position, settlement.position);
          const distB = distance(b.position, settlement.position);

          const penaltyA = a.type === targetType ? 0 : 22;
          const penaltyB = b.type === targetType ? 0 : 22;

          return distA + penaltyA - (distB + penaltyB);
        })[0];

      if (!node) return npc;

      if (distance(npc.position, node.position) < 2.8) {
        const miningPower = npc.societyRole?.type === "miner" ? 15 : 5;
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
  const constructionNeed = getPendingConstructionNeed(settlement);
  if (constructionNeed && isConstructionWorker(npc)) return constructionNeed;

  if (npc.societyRole?.type === "researcher") return "data";
  if (npc.societyRole?.type === "connector") return "signal";
  if (npc.societyRole?.type === "architect") return (settlement.storage.matter ?? 0) < (settlement.storage.energy ?? 0) ? "matter" : "energy";
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
  if (!isConstructionWorker(npc)) return null;

  return (
    settlement.structures
      .filter((structure) => structure.status === "building")
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return distance(a.position, npc.position) - distance(b.position, npc.position);
      })[0] ?? null
  );
}

function addInventory<T extends Record<string, number>>(target: T, delta: Record<string, number>) {
  const next = { ...target };
  for (const [key, value] of Object.entries(delta)) {
    next[key as keyof T] = ((next[key as keyof T] as number || 0) + value) as T[keyof T];
  }
  return next;
}

function isConstructionWorker(npc: NPC) {
  return npc.societyRole?.type === "architect" || npc.societyRole?.type === "connector" || npc.societyRole?.type === "builder";
}

function getPendingConstructionNeed(settlement: DigitalSettlement): MineableResourceType | null {
  const planned = settlement.structures.find((structure) => structure.status === "planned");
  if (!planned) return null;

  const missing = (Object.entries(planned.cost) as Array<[keyof ResourceInventory, number]>)
    .map(([resource, amount]) => ({
      resource,
      deficit: Math.max(0, (amount ?? 0) - (settlement.storage[resource] ?? 0)),
    }))
    .filter((entry) => entry.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit);

  return (missing[0]?.resource as MineableResourceType | undefined) ?? null;
}

function hasPendingConstructionNeed(settlement: DigitalSettlement) {
  return getPendingConstructionNeed(settlement) !== null;
}

function getConstructionStandPosition(structure: Structure, npcId: string, radius: number) {
  const angle = hash(`${npcId}:${structure.id}`) * Math.PI * 2;
  return projectToSphere(
    {
      x: structure.position.x + Math.cos(angle) * WORKER_STAND_DISTANCE,
      y: structure.position.y,
      z: structure.position.z + Math.sin(angle) * WORKER_STAND_DISTANCE,
    },
    radius,
  );
}

function getConstructionWorkAmount(npc: NPC, settlement: DigitalSettlement, deltaSeconds: number) {
  const rolePower = npc.societyRole?.type === "builder" ? 7.4 : npc.societyRole?.type === "architect" ? 6.2 : 4.2;
  const energyFactor = 0.55 + npc.needs.energy / 180;
  const focusFactor = 0.9 + (npc.personality.loyalty + npc.personality.openness) / 450;
  const techFactor = 1 + Math.max(0, settlement.techLevel - 1) * 0.08;

  return Math.max(1.4, rolePower * energyFactor * focusFactor * techFactor * deltaSeconds);
}

function applyConstructionWork(
  settlements: DigitalSettlement[],
  settlementId: string,
  structureId: string,
  workerId: string,
  workAmount: number,
) {
  return settlements.map((settlement) => {
    if (settlement.id !== settlementId) return settlement;

    let changed = false;
    let completedNow = false;
    const structures = settlement.structures.map((structure) => {
      if (structure.id !== structureId || structure.status !== "building") return structure;

      changed = true;
      const progress = Math.min(100, structure.progress + workAmount);
      const status = progress >= 100 ? "completed" as const : "building" as const;
      completedNow = status === "completed";

      return {
        ...structure,
        progress,
        status,
        activeWorkers: status === "building" ? addActiveWorker(structure.activeWorkers, workerId) : [],
      };
    });

    if (!changed) return settlement;

    const nextSettlement = {
      ...settlement,
      structures,
      defense: structures.filter((structure) => structure.status === "completed" && structure.type === "shield_gate").length * 28,
      growthScore: settlement.growthScore + (completedNow ? 1.25 : 0.05),
    };

    return completedNow ? connectSettlementPaths(nextSettlement) : nextSettlement;
  });
}

function clearConstructionWorkers(settlements: DigitalSettlement[]) {
  return settlements.map((settlement) => {
    let changed = false;
    const structures = settlement.structures.map((structure) => {
      if (!structure.activeWorkers?.length) return structure;
      changed = true;
      return { ...structure, activeWorkers: [] };
    });

    return changed ? { ...settlement, structures } : settlement;
  });
}

function addActiveWorker(activeWorkers: string[] | undefined, workerId: string) {
  return activeWorkers?.includes(workerId) ? activeWorkers : [...(activeWorkers ?? []), workerId];
}

function clampNeed(value: number) {
  return Math.max(0, Math.min(100, value));
}
