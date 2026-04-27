import type { NPC, NPCMemoryRecord } from "./types";

const MAX_MEMORY = 24;

export function remember(npc: NPC, memory: NPCMemoryRecord): NPC {
  return {
    ...npc,
    memory: [memory, ...npc.memory].slice(0, MAX_MEMORY),
  };
}

export function maybeRememberAction(npc: NPC, targetId: string, description: string, impact: number, timestamp: number) {
  if (Math.abs(impact) < 18) return npc;

  return remember(npc, {
    type: impact >= 0 ? "reward" : "danger",
    targetId,
    description,
    impact,
    timestamp,
  });
}
