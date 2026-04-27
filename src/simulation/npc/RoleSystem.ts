import type { NPC, NPCSocietyRole } from "../../npc/types";
import type { Society } from "../society/types";
import type { DigitalSettlement } from "../village/types";

export class RoleSystem {
  assignRoles(npcs: NPC[], societies: Society[], settlements: DigitalSettlement[]): NPC[] {
    return npcs.map((npc) => {
      const society = societies.find((candidate) => candidate.members.includes(npc.id));
      if (!society) {
        return {
          ...npc,
          societyId: null,
          societyRole: { type: "wanderer" as const, priority: 20, assignedBy: "self" as const },
        };
      }

      const settlement = settlements.find((candidate) => candidate.societyId === society.id);
      const role = chooseRole(npc, society, settlement);

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

function chooseRole(npc: NPC, society: Society, settlement?: DigitalSettlement): NPCSocietyRole {
  if (society.leaderId === npc.id) return "leader";
  if (society.dangerLevel > 45 || npc.personality.aggression > 58) return "guardian";

  const hasConstruction = settlement?.structures.some((structure) => structure.status !== "completed") ?? false;
  const isNeonPath = settlement?.structures.some((structure) => structure.status !== "completed" && structure.type === "neon_path") ?? false;

  if (isNeonPath && npc.personality.social > 50) return "connector";

  if (hasConstruction) {
    // Apenas ~33% viram builders, o resto continua minerando ou pesquisando
    if (npc.role === "builder" || npc.id.charCodeAt(0) % 3 === 0) {
      return "builder";
    }
  }

  if ((settlement?.storage.energy ?? 0) < 36 || (settlement?.storage.matter ?? 0) < 28 || npc.role === "farmer") return "miner";
  if ((settlement?.storage.data ?? 0) < 30 || society.culture.innovation < 48) return "researcher";
  if (npc.personality.curiosity > 70) return "scout";
  if (npc.personality.social > 62) return "connector";
  
  return "miner";
}
