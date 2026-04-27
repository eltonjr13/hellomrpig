import type { NPCSocietyRole } from "../npc/types";
import type { ResourceType } from "../simulation/resources/types";
import type { StructureType } from "../simulation/village/types";

export const tronTheme = {
  ground: "#05070d",
  glass: "#090f18",
  panel: "#101827",
  hologram: "#75f7ff",
  cyan: "#00e5ff",
  blue: "#247cff",
  orange: "#ff9f1c",
  magenta: "#d85cff",
  green: "#65ff9a",
  red: "#ff3f71",
  white: "#eafcff",
};

export const societyNeonPalette = ["#00e5ff", "#247cff", "#ff9f1c", "#d85cff", "#65ff9a", "#f5f749"];

export const resourceColors: Record<ResourceType, string> = {
  energy: "#00e5ff",
  data: "#247cff",
  matter: "#b9c7d8",
  signal: "#ff9f1c",
  core: "#d85cff",
};

export const roleGlowColors: Record<NPCSocietyRole, string> = {
  wanderer: "#eafcff",
  collector: "#00e5ff",
  architect: "#ff9f1c",
  guardian: "#ff3f71",
  researcher: "#d85cff",
  connector: "#65ff9a",
  leader: "#f5f749",
  scout: "#247cff",
};

export const structureColors: Record<StructureType, string> = {
  core_node: "#00e5ff",
  habitation_pod: "#247cff",
  energy_tower: "#00e5ff",
  data_farm: "#d85cff",
  logic_lab: "#f5f749",
  social_hub: "#65ff9a",
  shield_gate: "#ff3f71",
  neon_path: "#ff9f1c",
  memory_archive: "#b58cff",
};

export function getSocietyNeonColor(id: string) {
  return societyNeonPalette[hash(id) % societyNeonPalette.length];
}

function hash(value: string) {
  let state = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return state >>> 0;
}
