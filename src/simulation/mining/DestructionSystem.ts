import type { MineableNode } from "./types";

export class DestructionSystem {
  processDestruction(nodes: MineableNode[]): MineableNode[] {
    // Pode ser expandido futuramente para dropar items no chão,
    // explodir em partículas, etc.
    // Por enquanto, apenas garante que health <= 0 marque isDestroyed
    return nodes.map(node => {
      if (!node.isDestroyed && (node.health <= 0 || node.amount <= 0)) {
        return {
          ...node,
          isDestroyed: true,
          health: 0,
          amount: 0,
        };
      }
      return node;
    });
  }
}
