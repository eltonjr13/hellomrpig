import type { NPC, NPCMood } from "./types";

export function updateMood(npc: NPC): NPC {
  const dangerMemory = npc.memory.find((memory) => memory.type === "danger" && memory.impact < -35);
  const recentReward = npc.memory.find((memory) => memory.type === "reward" && memory.impact > 25);
  const lowEnergy = npc.needs.energy < 24;
  const lowSafety = npc.needs.safety < 32;
  const lowSocial = npc.needs.social < 25 && npc.personality.social > 55;

  let mood: NPCMood = { current: "neutral", intensity: 0.35 };

  if (lowSafety || dangerMemory) {
    mood = { current: npc.personality.aggression > npc.personality.fear ? "angry" : "afraid", intensity: 0.78 };
  } else if (lowEnergy) {
    mood = { current: "sad", intensity: 0.48 };
  } else if (recentReward) {
    mood = { current: "happy", intensity: 0.72 };
  } else if (npc.personality.curiosity > 70 && npc.needs.energy > 50) {
    mood = { current: "excited", intensity: 0.58 };
  } else if (lowSocial) {
    mood = { current: "sad", intensity: 0.42 };
  }

  return { ...npc, mood };
}
