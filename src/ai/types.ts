import type { NpcAgent, Vec3Tuple } from "../store/useGameStore";

export type AiWorldEvent = {
  id: string;
  type: "dialog" | "quest" | "spawn" | "terrain";
  position?: Vec3Tuple;
  payload: Record<string, unknown>;
};

export type NpcDecisionInput = {
  npc: NpcAgent;
  playerPosition: Vec3Tuple;
  nearbyEvents: AiWorldEvent[];
};

export type NpcDecision = {
  nextMood: NpcAgent["mood"];
  message?: string;
  event?: AiWorldEvent;
};
