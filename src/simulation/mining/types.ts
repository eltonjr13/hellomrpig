import type { NPCPosition } from "../../npc/types";

export type MineableResourceType = "energy" | "matter" | "data" | "crystal" | "signal";

export interface MineableNode {
  id: string;
  type: MineableResourceType;
  position: NPCPosition;
  amount: number;
  maxAmount: number;
  hardness: number; // Resistência à mineração (dano necessário para extrair)
  health: number; // Saúde atual do nó
  maxHealth: number; // Saúde máxima
  respawnTime: number; // Tempo para regenerar
  isDestroyed: boolean;
}
