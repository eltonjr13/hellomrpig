import type { MineableNode } from "./types";

export type MiningResult = {
  nodes: MineableNode[];
  harvestedAmount: number;
};

export class MiningSystem {
  mineNode(nodes: MineableNode[], nodeId: string, damage: number): MiningResult {
    let harvestedAmount = 0;
    
    const nextNodes = nodes.map((node) => {
      if (node.id !== nodeId || node.isDestroyed || node.amount <= 0) return node;

      const newHealth = Math.max(0, node.health - damage);
      const healthLost = node.health - newHealth;
      
      // Calculate how much resource is extracted based on health lost and hardness
      const potentialHarvest = healthLost / node.hardness;
      
      // We only extract whole integer amounts to keep it simple, or we can accumulate.
      // Let's just say we can extract decimals, but Math.floor it for inventory if needed.
      const actualHarvest = Math.min(potentialHarvest, node.amount);
      
      harvestedAmount = actualHarvest;
      
      const newAmount = Math.max(0, node.amount - actualHarvest);
      
      const isDestroyed = newHealth <= 0 || newAmount <= 0;

      return {
        ...node,
        health: newHealth,
        amount: newAmount,
        isDestroyed,
      };
    });

    return { nodes: nextNodes, harvestedAmount };
  }
}
