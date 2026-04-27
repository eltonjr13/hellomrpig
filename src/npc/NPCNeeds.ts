import type { NPCNeeds, NPC } from "./types";

const MIN_NEED = 0;
const MAX_NEED = 100;

export function updateNeeds(npc: NPC, deltaSeconds: number) {
  const needs: NPCNeeds = {
    energy: npc.needs.energy - deltaSeconds * (npc.currentAction === "rest" ? -5.5 : 0.45),
    hunger: npc.needs.hunger - deltaSeconds * 0.22,
    social: npc.needs.social - deltaSeconds * (npc.currentAction === "talk_to_npc" ? -3.4 : 0.18),
    safety: npc.needs.safety - deltaSeconds * (npc.currentAction === "avoid_player" ? -1.5 : 0.08),
    purpose: npc.needs.purpose - deltaSeconds * (npc.currentAction === "explore_area" ? -1.2 : 0.12),
  };

  return {
    ...npc,
    needs: clampNeeds(needs),
  };
}

export function clampNeeds(needs: NPCNeeds): NPCNeeds {
  return {
    energy: clampNeed(needs.energy),
    hunger: clampNeed(needs.hunger),
    social: clampNeed(needs.social),
    safety: clampNeed(needs.safety),
    purpose: clampNeed(needs.purpose),
  };
}

function clampNeed(value: number) {
  return Math.max(MIN_NEED, Math.min(MAX_NEED, value));
}
