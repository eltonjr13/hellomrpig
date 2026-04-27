import type { NPC } from "../../npc/types";

export function chooseLeader(memberIds: string[], npcs: NPC[]) {
  return memberIds
    .map((id) => npcs.find((npc) => npc.id === id))
    .filter((npc): npc is NPC => Boolean(npc))
    .sort((a, b) => getLeadershipScore(b) - getLeadershipScore(a))[0]?.id ?? null;
}

function getLeadershipScore(npc: NPC) {
  return npc.personality.social * 0.35 + npc.personality.loyalty * 0.3 + npc.personality.openness * 0.2 + npc.personality.aggression * 0.15;
}
