import type { NPC, NPCSocietyRole } from "../../npc/types";
import type { Society } from "../society/types";
import type { Village } from "../village/types";

export class RoleSystem {
  assignRoles(npcs: NPC[], societies: Society[], villages: Village[]): NPC[] {
    return npcs.map((npc) => {
      const society = societies.find((candidate) => candidate.members.includes(npc.id));
      if (!society) {
        return {
          ...npc,
          societyId: null,
          societyRole: { type: "wanderer" as const, priority: 20, assignedBy: "self" as const },
        };
      }

      const village = villages.find((candidate) => candidate.societyId === society.id);
      const role = chooseRole(npc, society, village);

      return {
        ...npc,
        societyId: society.id,
        societyRole: {
          type: role,
          priority: role === "leader" ? 100 : 60,
          assignedBy: role === "leader" ? "society" as const : "self" as const,
        },
      };
    });
  }
}

function chooseRole(npc: NPC, society: Society, village?: Village): NPCSocietyRole {
  if (society.leaderId === npc.id) return "leader";
  if ((village?.storage.food ?? 0) < 35 || npc.role === "farmer") return "farmer";
  if ((village?.buildings.some((building) => building.status !== "completed") ?? false) || npc.role === "builder") return "builder";
  if (society.dangerLevel > 45 || npc.personality.aggression > 58) return "guard";
  if (npc.personality.curiosity > 70) return "scout";
  if (npc.personality.social > 62) return "gatherer";
  return "gatherer";
}
