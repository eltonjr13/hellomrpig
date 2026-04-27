import type { NPC } from "../../npc/types";
import type { Society } from "./types";

export function deriveCulture(society: Society, npcs: NPC[]) {
  const members = society.members.map((id) => npcs.find((npc) => npc.id === id)).filter((npc): npc is NPC => Boolean(npc));
  if (members.length === 0) return society.culture;

  const average = (selector: (npc: NPC) => number) =>
    members.reduce((total, npc) => total + selector(npc), 0) / members.length;

  return {
    cooperation: average((npc) => npc.personality.social * 0.5 + npc.personality.loyalty * 0.5),
    aggression: average((npc) => npc.personality.aggression),
    innovation: average((npc) => npc.personality.curiosity * 0.65 + npc.personality.openness * 0.35),
    tradition: average((npc) => npc.personality.loyalty),
    expansion: average((npc) => npc.personality.curiosity * 0.45 + npc.personality.aggression * 0.25 + npc.personality.openness * 0.3),
  };
}
