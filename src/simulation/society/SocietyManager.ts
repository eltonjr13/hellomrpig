import type { NPC } from "../../npc/types";
import { emptyInventory, normalizeInventory } from "../resources/types";
import { getSocietyNeonColor } from "../../theme/tronTheme";
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
        resources: { ...emptyInventory, energy: 36, data: 12, matter: 24, signal: 14, core: 1 },
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
        neonColor: getSocietyNeonColor(`${planetId}-society-1`),
        techLevel: 1,
        signalReach: 18,
        coreNodeId: null,
        collectiveMemory: ["Primeiro pulso do core digital."],
        createdAt: now,
      };

      return [this.updateSocietyCulture(society, npcs)];
    }

    return societies.map((society) => this.updateSocietyCulture(society, npcs));
  }

  private updateSocietyCulture(society: Society, npcs: NPC[]) {
    const culture = deriveCulture(society, npcs);
    const resources = normalizeInventory(society.resources);
    const wealth = Object.values(resources).reduce((total, value) => total + value, 0);
    const stability = Math.max(0, Math.min(100, culture.cooperation * 0.55 + society.members.length * 4 - society.dangerLevel * 0.25));
    const techLevel = Math.max(1, Math.min(12, Math.floor(1 + resources.data / 120 + culture.innovation / 38 + resources.core / 5)));

    return {
      ...society,
      resources,
      culture,
      wealth,
      stability,
      neonColor: society.neonColor ?? getSocietyNeonColor(society.id),
      techLevel,
      signalReach: Math.max(18, Math.min(180, 18 + resources.signal * 0.22 + culture.cooperation * 0.4)),
      coreNodeId: society.coreNodeId ?? null,
      collectiveMemory: society.collectiveMemory ?? [],
      territoryRadius: Math.max(28, Math.min(120, 28 + society.members.length * 6 + culture.expansion * 0.35)),
    };
  }
}

function getSocietyName(planetId: string) {
  if (planetId === "praca-nova") return "Circuito da Praca";
  if (planetId === "neuralis") return "Rede Neon Neuralis";
  if (planetId === "ferro-zero") return "Nucleo Ferro Zero";
  return "Matriz Verdantia";
}
