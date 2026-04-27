import type { NPC } from "../../npc/types";
import { emptyInventory } from "../resources/types";
import type { Society } from "./types";
import { deriveCulture } from "./CultureSystem";
import { chooseLeader } from "./LeadershipSystem";

export class SocietyManager {
  update(planetId: string, npcs: NPC[], societies: Society[], now: number) {
    if (societies.length === 0 && npcs.length >= 3) {
      const members = npcs.slice(0, Math.min(6, npcs.length)).map((npc) => npc.id);
      const leaderId = chooseLeader(members, npcs);
      const center = npcs[0].homePosition;
      const society: Society = {
        id: `${planetId}-society-1`,
        name: getSocietyName(planetId),
        planetId,
        members,
        leaderId,
        territoryCenter: center,
        territoryRadius: 32,
        resources: { ...emptyInventory, wood: 18, food: 12, water: 10, stone: 8, fiber: 8 },
        culture: {
          cooperation: 50,
          aggression: 25,
          innovation: 45,
          tradition: 45,
          expansion: 40,
        },
        stability: 68,
        wealth: 12,
        dangerLevel: 12,
        createdAt: now,
      };

      return [this.updateSocietyCulture(society, npcs)];
    }

    return societies.map((society) => this.updateSocietyCulture(society, npcs));
  }

  private updateSocietyCulture(society: Society, npcs: NPC[]) {
    const culture = deriveCulture(society, npcs);
    const wealth = Object.values(society.resources).reduce((total, value) => total + value, 0);
    const stability = Math.max(0, Math.min(100, culture.cooperation * 0.55 + society.members.length * 4 - society.dangerLevel * 0.25));

    return {
      ...society,
      culture,
      wealth,
      stability,
      territoryRadius: Math.max(28, Math.min(120, 28 + society.members.length * 6 + culture.expansion * 0.35)),
    };
  }
}

function getSocietyName(planetId: string) {
  if (planetId === "praca-nova") return "Circulo da Praca";
  if (planetId === "neuralis") return "Rede Neuralis";
  if (planetId === "ferro-zero") return "Pacto Ferro Zero";
  return "Clareira Verdantia";
}
