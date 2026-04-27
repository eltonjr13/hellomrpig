import type { NPC, NPCWorldState } from "./types";
import { decideNPCAction } from "./NPCBrain";
import { applyActionReward } from "./NPCLearning";
import { maybeRememberAction } from "./NPCMemory";
import { updateMood } from "./NPCMood";
import { moveNPC, chooseTargetForAction } from "./NPCMovement";
import { updateNeeds } from "./NPCNeeds";
import { updateRelationship } from "./NPCRelationships";

const DECISION_INTERVAL_MS = 1800;

export class NPCManager {
  update(npcs: NPC[], worldState: NPCWorldState) {
    return npcs.map((npc) => this.updateNPC(npc, worldState));
  }

  private updateNPC(npc: NPC, worldState: NPCWorldState) {
    let next = updateNeeds(npc, worldState.delta);
    next = updateMood(next);

    if (worldState.now - next.lastDecisionAt >= DECISION_INTERVAL_MS) {
      const decision = decideNPCAction(next, worldState);
      const reward = estimateReward(next, decision.action);

      next = {
        ...next,
        currentAction: decision.action,
        targetPosition: decision.targetPosition ?? chooseTargetForAction(next, decision.action, worldState),
        lastDecisionAt: worldState.now,
        goals: [
          {
            id: `${next.id}-${decision.action}-${worldState.now}`,
            type: actionToGoal(decision.action),
            priority: Math.round(decision.score),
            status: "active" as const,
          },
          ...next.goals,
        ].slice(0, 5),
      };

      next = applyActionReward(next, decision.action, reward, worldState);
      next = maybeRememberAction(next, "environment", `Action ${decision.action}: ${decision.reason}`, reward, worldState.now);

      if (decision.action === "approach_player" || decision.action === "follow_player") {
        next = updateRelationship(next, worldState.player.id, "player", 4, worldState.now);
      }

      if (decision.action === "avoid_player") {
        next = updateRelationship(next, worldState.player.id, "player", -8, worldState.now);
      }
    }

    return moveNPC(next, worldState, worldState.delta);
  }
}

function estimateReward(npc: NPC, action: NPC["currentAction"]) {
  if (action === "rest") return npc.needs.energy < 35 ? 28 : -5;
  if (action === "approach_player" || action === "talk_to_npc") return npc.personality.social > 55 ? 18 : -4;
  if (action === "avoid_player") return npc.needs.safety < 45 ? 22 : -8;
  if (action === "explore_area") return npc.personality.curiosity > 60 ? 16 : 2;
  if (action === "follow_player") return npc.personality.loyalty > 55 ? 14 : -3;
  return 4;
}

function actionToGoal(action: NPC["currentAction"]): NPC["goals"][number]["type"] {
  if (action === "rest" || action === "return_home") return "rest";
  if (action === "approach_player" || action === "talk_to_npc") return "socialize";
  if (action === "avoid_player" || action === "go_to_safe_place") return "avoid";
  if (action === "follow_player") return "follow";
  return "explore";
}
