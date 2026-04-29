import type { NPC, NPCAction, NPCPosition, NPCWorldState } from "./types";

export function chooseTargetForAction(npc: NPC, action: NPCAction, worldState: NPCWorldState): NPCPosition {
  if (action === "approach_player" || action === "follow_player") {
    return offsetFrom(worldState.player.position, npc.id.length * 0.37, 3.2, worldState.planetRadius);
  }

  if (action === "avoid_player" || action === "go_to_safe_place") {
    return moveAwayFrom(npc.position, worldState.player.position, 16, worldState.planetRadius);
  }

  if (action === "rest" || action === "return_home" || action === "protect") {
    return npc.homePosition;
  }

  return randomSurfaceTarget(npc, worldState.planetRadius, worldState.now);
}

export function moveNPC(npc: NPC, worldState: NPCWorldState, deltaSeconds: number): NPC {
  const dx = npc.targetPosition.x - npc.position.x;
  const dy = npc.targetPosition.y - npc.position.y;
  const dz = npc.targetPosition.z - npc.position.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance < 0.75 || npc.currentAction === "rest") {
    return npc;
  }

  const speed = getActionSpeed(npc.currentAction, npc.mood.current) * deltaSeconds;
  const step = Math.min(speed, distance);
  const next = {
    x: npc.position.x + (dx / distance) * step,
    y: npc.position.y + (dy / distance) * step,
    z: npc.position.z + (dz / distance) * step,
  };

  return {
    ...npc,
    position: projectToSphere(next, worldState.planetRadius),
  };
}

function getActionSpeed(action: NPCAction, mood: NPC["mood"]["current"]) {
  const base = action === "avoid_player" ? 2.4 : action === "explore_area" ? 1.65 : action === "rest" ? 0 : action === "build_structure" ? 1.08 : 1.25;
  if (mood === "afraid" || mood === "excited") return base * 1.28;
  if (mood === "sad") return base * 0.72;
  return base;
}

function randomSurfaceTarget(npc: NPC, radius: number, now: number): NPCPosition {
  const seed = hash(`${npc.id}:${Math.floor(now / 7000)}:${npc.currentAction}`);
  const angle = seed * Math.PI * 2;
  const distance = 8 + hash(`${npc.id}:dist:${Math.floor(now / 9000)}`) * 26;

  return projectToSphere(
    {
      x: npc.position.x + Math.cos(angle) * distance,
      y: npc.position.y,
      z: npc.position.z + Math.sin(angle) * distance,
    },
    radius,
  );
}

function offsetFrom(position: NPCPosition, angleSeed: number, distance: number, radius: number) {
  return projectToSphere(
    {
      x: position.x + Math.cos(angleSeed) * distance,
      y: position.y,
      z: position.z + Math.sin(angleSeed) * distance,
    },
    radius,
  );
}

function moveAwayFrom(position: NPCPosition, threat: NPCPosition, distance: number, radius: number) {
  const dx = position.x - threat.x;
  const dz = position.z - threat.z;
  const length = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));

  return projectToSphere(
    {
      x: position.x + (dx / length) * distance,
      y: position.y,
      z: position.z + (dz / length) * distance,
    },
    radius,
  );
}

function projectToSphere(position: NPCPosition, radius: number): NPCPosition {
  const centerY = -radius;
  const dx = position.x;
  const dy = position.y - centerY;
  const dz = position.z;
  const length = Math.max(0.001, Math.sqrt(dx * dx + dy * dy + dz * dz));

  return {
    x: (dx / length) * radius,
    y: centerY + (dy / length) * radius,
    z: (dz / length) * radius,
  };
}

function hash(value: string) {
  let state = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0) / 4294967295;
}
