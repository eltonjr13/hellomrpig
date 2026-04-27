import type { NPC, NPCRelationship } from "./types";

export function updateRelationship(
  npc: NPC,
  targetId: string,
  targetType: NPCRelationship["targetType"],
  impact: number,
  timestamp: number,
) {
  const existing = npc.relationships.find((relationship) => relationship.targetId === targetId);
  const nextRelationship: NPCRelationship = existing
    ? {
        ...existing,
        trust: clamp(existing.trust + impact * 0.22),
        fear: clamp(existing.fear + Math.max(0, -impact) * 0.28),
        affinity: clamp(existing.affinity + impact * 0.3),
        lastInteraction: timestamp,
      }
    : {
        targetId,
        targetType,
        trust: clamp(50 + impact * 0.22),
        fear: clamp(Math.max(0, -impact) * 0.28),
        affinity: clamp(50 + impact * 0.3),
        lastInteraction: timestamp,
      };

  return {
    ...npc,
    relationships: [
      nextRelationship,
      ...npc.relationships.filter((relationship) => relationship.targetId !== targetId),
    ].slice(0, 30),
  };
}

export function getRelationship(npc: NPC, targetId: string) {
  return npc.relationships.find((relationship) => relationship.targetId === targetId) ?? null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
