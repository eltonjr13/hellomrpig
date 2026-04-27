import type { NPCPosition } from "../../npc/types";
import { distance, projectToSphere } from "../resources/ResourceManager";
import type { MineableNode, MineableResourceType } from "./types";

const RESOURCE_SEQUENCE: MineableResourceType[] = ["energy", "matter", "data", "signal", "energy", "matter", "data", "crystal"];

export class MineableNodeManager {
  createInitialNodes(planetId: string, radius: number, count = 72): MineableNode[] {
    return Array.from({ length: count }, (_, index) => {
      const type = RESOURCE_SEQUENCE[index % RESOURCE_SEQUENCE.length];
      const angle = hash(`${planetId}:resource:angle:${index}`) * Math.PI * 2;
      const dist = 16 + hash(`${planetId}:resource:distance:${index}`) * radius * 0.46;
      const position = projectToSphere(
        {
          x: Math.cos(angle) * dist,
          y: 0,
          z: Math.sin(angle) * dist,
        },
        radius,
      );
      
      const maxAmount = Math.round(getBaseAmount(type) + hash(`${planetId}:resource:amount:${index}`) * getAmountVariance(type));
      const hardness = getHardness(type);
      const maxHealth = maxAmount * hardness;

      return {
        id: `${planetId}-mineable-node-${index}`,
        type,
        position,
        amount: maxAmount,
        maxAmount,
        hardness,
        health: maxHealth,
        maxHealth,
        respawnTime: getRespawnTime(type),
        isDestroyed: false,
      };
    });
  }

  update(nodes: MineableNode[], deltaSeconds: number) {
    return nodes.map((node) => {
      // Regenerate if destroyed and enough time passed, or if we want a slow regen over time?
      // For now, let's say if it's destroyed, it takes respawnTime to come back.
      // We will handle respawn later, or simply not respawn crystals.
      if (node.isDestroyed) {
        if (node.type === "crystal") return node; // Crystals don't respawn easily
        
        // Simple respawn logic: chance to respawn based on delta
        if (Math.random() < (1 / node.respawnTime) * deltaSeconds) {
           return {
             ...node,
             isDestroyed: false,
             health: node.maxHealth,
             amount: node.maxAmount,
           }
        }
        return node;
      }
      
      return node;
    });
  }
}

function getBaseAmount(type: MineableResourceType) {
  if (type === "crystal") return 8;
  if (type === "signal") return 30;
  if (type === "data") return 34;
  if (type === "matter") return 46;
  return 56; // energy
}

function getAmountVariance(type: MineableResourceType) {
  if (type === "crystal") return 12;
  if (type === "signal") return 38;
  if (type === "data") return 48;
  return 72;
}

function getHardness(type: MineableResourceType) {
  if (type === "crystal") return 5;
  if (type === "matter") return 3;
  if (type === "data") return 2;
  if (type === "signal") return 1;
  return 1; // energy
}

function getRespawnTime(type: MineableResourceType) {
  if (type === "crystal") return 999999;
  if (type === "matter") return 300;
  if (type === "data") return 200;
  if (type === "signal") return 150;
  return 100; // energy
}

function hash(value: string) {
  let state = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0) / 4294967295;
}
