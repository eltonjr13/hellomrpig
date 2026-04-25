import type { NpcDecision, NpcDecisionInput } from "./types";

export interface AiEngine {
  decideNpcAction(input: NpcDecisionInput): Promise<NpcDecision>;
}

export class MockAiEngine implements AiEngine {
  async decideNpcAction(input: NpcDecisionInput): Promise<NpcDecision> {
    const distanceToPlayer = Math.hypot(
      input.npc.position[0] - input.playerPosition[0],
      input.npc.position[2] - input.playerPosition[2],
    );

    return {
      nextMood: distanceToPlayer < 6 ? "curious" : "idle",
      message: distanceToPlayer < 6 ? "Player nearby" : undefined,
    };
  }
}
