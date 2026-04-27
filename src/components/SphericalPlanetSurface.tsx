import { memo } from "react";
import type { PlanetEnvironment } from "../world/PlanetManager";

type SphericalPlanetSurfaceProps = {
  radius: number;
  environment: PlanetEnvironment;
};

export const SphericalPlanetSurface = memo(function SphericalPlanetSurface({
  radius,
  environment,
}: SphericalPlanetSurfaceProps) {
  return (
    <group name="spherical-planet-surface" position={[0, -radius, 0]}>
      <mesh receiveShadow>
        <sphereGeometry args={[radius, 96, 48]} />
        <meshStandardMaterial color={environment.groundColor} roughness={0.96} metalness={0.01} />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[radius, 96, 48]} />
        <meshStandardMaterial color={environment.fogColor} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
});
