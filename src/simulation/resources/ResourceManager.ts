import type { NPCPosition } from "../../npc/types";
import type { ResourceNode, ResourceType } from "./types";

const RESOURCE_TYPES: ResourceType[] = ["wood", "stone", "food", "water", "fiber", "metal"];

export class ResourceManager {
  createInitialNodes(planetId: string, radius: number, count = 72): ResourceNode[] {
    return Array.from({ length: count }, (_, index) => {
      const type = RESOURCE_TYPES[index % RESOURCE_TYPES.length];
      const angle = hash(`${planetId}:resource:angle:${index}`) * Math.PI * 2;
      const distance = 16 + hash(`${planetId}:resource:distance:${index}`) * radius * 0.46;
      const position = projectToSphere(
        {
          x: Math.cos(angle) * distance,
          y: 0,
          z: Math.sin(angle) * distance,
        },
        radius,
      );
      const maxAmount = Math.round(45 + hash(`${planetId}:resource:amount:${index}`) * 80);

      return {
        id: `${planetId}-resource-${index}`,
        type,
        position,
        amount: maxAmount,
        maxAmount,
        regenRate: type === "water" ? 1.8 : type === "food" ? 1.25 : 0.45,
      };
    });
  }

  update(nodes: ResourceNode[], deltaSeconds: number) {
    return nodes.map((node) => ({
      ...node,
      amount: Math.min(node.maxAmount, node.amount + node.regenRate * deltaSeconds),
    }));
  }

  harvest(nodes: ResourceNode[], nodeId: string, amount: number) {
    let harvested = 0;
    const nextNodes = nodes.map((node) => {
      if (node.id !== nodeId || node.amount <= 0) return node;
      harvested = Math.min(amount, node.amount);
      return { ...node, amount: node.amount - harvested };
    });

    return { nodes: nextNodes, harvested };
  }
}

export function projectToSphere(position: NPCPosition, radius: number): NPCPosition {
  const centerY = -radius;
  const dx = position.x;
  const dy = position.y - centerY;
  const dz = position.z;
  const length = Math.max(0.001, Math.sqrt(dx * dx + dy * dy + dz * dz));

  return {
    x: (dx / length) * radius,
    y: centerY + (dy / length) * radius,
    z: (dz / length) * radius,
  };
}

export function distance(a: NPCPosition, b: NPCPosition) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function hash(value: string) {
  let state = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0) / 4294967295;
}
