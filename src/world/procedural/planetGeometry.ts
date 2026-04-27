export function getSphereSurfaceY(radius: number, x: number, z: number) {
  const horizontalDistanceSq = x * x + z * z;
  const safeDistanceSq = Math.min(horizontalDistanceSq, radius * radius * 0.98);

  return -radius + Math.sqrt(radius * radius - safeDistanceSq);
}

export function getPlanetSurfacePosition(radius: number, x: number, z: number, yOffset = 0): [number, number, number] {
  return [x, getSphereSurfaceY(radius, x, z) + yOffset, z];
}
