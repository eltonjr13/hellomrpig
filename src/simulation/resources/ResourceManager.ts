import type { NPCPosition } from "../../npc/types";

export function projectToSphere(position: NPCPosition, radius: number): NPCPosition {
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

export function distance(a: NPCPosition, b: NPCPosition) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function hash(value: string) {
  let state = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0) / 4294967295;
}
