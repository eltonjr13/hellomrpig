import type { NPC, NPCAction, NPCWorldState } from "./types";
import { getRelationship } from "./NPCRelationships";

const ACTION_TO_WEIGHT: Partial<Record<NPCAction, keyof NPC["learning"]["behaviorWeights"]>> = {
  wander: "explore",
  explore_area: "explore",
  approach_player: "socialize",
  talk_to_npc: "socialize",
  rest: "rest",
  avoid_player: "avoid",
  go_to_safe_place: "avoid",
  follow_player: "follow",
  protect: "avoid",
};

export function applyActionReward(npc: NPC, action: NPCAction, reward: number, worldState: NPCWorldState) {
  const weight = ACTION_TO_WEIGHT[action];
  const behaviorWeights = { ...npc.learning.behaviorWeights };

  if (weight) {
    behaviorWeights[weight] = clampWeight(behaviorWeights[weight] + reward * 0.012);
  }

  return {
    ...npc,
    learning: {
      ...npc.learning,
      behaviorWeights,
      actionHistory: [
        {
          action,
          reward,
          timestamp: worldState.now,
          stateVector: getStateVector(npc, worldState),
        },
        ...npc.learning.actionHistory,
      ].slice(0, 80),
    },
  };
}

export function getStateVector(npc: NPC, worldState: NPCWorldState) {
  const trust = getRelationship(npc, worldState.player.id)?.trust ?? 50;
  const dangerMemory = npc.memory.some((memory) => memory.type === "danger" && memory.impact < -30);

  return [
    npc.needs.energy / 100,
    npc.needs.hunger / 100,
    npc.needs.social / 100,
    npc.needs.safety / 100,
    npc.mood.intensity,
    1,
    Math.max(0, worldState.npcs.length - 1),
    dangerMemory ? 1 : 0,
    trust / 100,
  ];
}

export function applyPolicyDecision(npc: NPC, worldState: NPCWorldState): NPCAction | null {
  void npc;
  void worldState;
  return null;
}

function clampWeight(value: number) {
  return Math.max(0.15, Math.min(2.5, value));
}
