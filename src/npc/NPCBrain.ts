import type { NPC, NPCAction, NPCDecision, NPCWorldState } from "./types";
import { getRelationship } from "./NPCRelationships";
import { applyPolicyDecision } from "./NPCLearning";

export function decideNPCAction(npc: NPC, worldState: NPCWorldState): NPCDecision {
  const policyAction = applyPolicyDecision(npc, worldState);
  if (policyAction) {
    return { action: policyAction, reason: "external_policy", score: 999 };
  }

  const playerRelationship = getRelationship(npc, worldState.player.id);
  const trust = playerRelationship?.trust ?? 50;
  const fear = playerRelationship?.fear ?? 0;
  const weights = npc.learning.behaviorWeights;
  const hour = new Date(worldState.now).getHours();
  const routineGoal = [...npc.routine].reverse().find((slot) => hour >= slot.hour)?.goal ?? "explore";

  const candidates: Array<NPCDecision> = [
    score("rest", 100 - npc.needs.energy + weights.rest * 20, "energy"),
    score("go_to_safe_place", 100 - npc.needs.safety + npc.personality.fear * 0.4 + weights.avoid * 18, "safety"),
    score("avoid_player", fear + (npc.learning.dangerousPlayers.includes(worldState.player.id) ? 45 : 0), "danger"),
    score(
      "approach_player",
      npc.personality.social * 0.35 + (100 - npc.needs.social) * 0.55 + trust * 0.3 + weights.socialize * 16,
      "social",
    ),
    score("follow_player", trust + npc.personality.loyalty * 0.4 + weights.follow * 20, "trust"),
    score("explore_area", npc.personality.curiosity * 0.8 + weights.explore * 25, "curiosity"),
    score("wander", 42 + npc.personality.openness * 0.28 + weights.explore * 10, "default"),
    score("return_home", routineGoal === "rest" ? 90 : 30, "routine"),
  ];

  if (routineGoal === "socialize") candidates.push(score("talk_to_npc", 84 + weights.socialize * 20, "routine"));
  if (routineGoal === "build") candidates.push(score("explore_area", 78 + npc.needs.purpose * 0.2, "routine"));

  return candidates.sort((a, b) => b.score - a.score)[0];
}

function score(action: NPCAction, value: number, reason: string): NPCDecision {
  return {
    action,
    reason,
    score: value,
  };
}
