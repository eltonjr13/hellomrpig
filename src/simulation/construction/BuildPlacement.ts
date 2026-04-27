import type { NPCPosition } from "../../npc/types";
import type { Structure, StructureType } from "../village/types";
import { distance, projectToSphere } from "../resources/ResourceManager";
import type { MineableNode } from "../mining/types";

const MIN_STRUCTURE_DISTANCE = 3.0;

export function findValidBuildPosition(
  type: StructureType,
  center: NPCPosition,
  existingStructures: Structure[],
  mineableNodes: MineableNode[],
  radius: number
): NPCPosition {
  // Tentar encontrar uma posição iterativamente
  let bestPos = { ...center };
  let bestScore = -Infinity;

  // Gerar alguns candidatos ao redor do centro
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 20; // Raio entre 5 e 25

    const candidate = {
      x: center.x + Math.cos(angle) * dist,
      y: center.y,
      z: center.z + Math.sin(angle) * dist,
    };

    const projectedCandidate = projectToSphere(candidate, radius);

    if (isValidPosition(projectedCandidate, existingStructures)) {
      const score = evaluatePosition(type, projectedCandidate, center, mineableNodes);
      if (score > bestScore) {
        bestScore = score;
        bestPos = projectedCandidate;
      }
    }
  }

  return bestPos;
}

function isValidPosition(pos: NPCPosition, structures: Structure[]): boolean {
  return !structures.some((s) => distance(s.position, pos) < MIN_STRUCTURE_DISTANCE);
}

function evaluatePosition(
  type: StructureType,
  pos: NPCPosition,
  center: NPCPosition,
  nodes: MineableNode[]
): number {
  let score = 0;

  // Regras específicas de arquitetura
  if (type === "energy_tower") {
    // Perto de energy nodes
    const nearbyEnergy = nodes.filter(n => n.type === "energy" && distance(n.position, pos) < 10);
    score += nearbyEnergy.length * 10;
  } else if (type === "data_farm") {
    // Perto de data nodes
    const nearbyData = nodes.filter(n => n.type === "data" && distance(n.position, pos) < 10);
    score += nearbyData.length * 10;
  } else if (type === "shield_gate") {
    // Mais longe do centro (bordas)
    score += distance(pos, center) * 2;
  } else if (type === "social_hub") {
    // Mais perto do centro
    score -= distance(pos, center) * 2;
  }

  // Bônus base por não estar muito longe
  score -= distance(pos, center) * 0.5;

  return score;
}
