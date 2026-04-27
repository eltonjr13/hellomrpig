import { memo } from "react";
import type { Structure } from "../../simulation/village/types";
import { tronTheme } from "../../theme/tronTheme";

export const EnergyTowerMesh = memo(function EnergyTowerMesh({ structure, color }: { structure: Structure; color: string }) {
  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.28, 0.46, 1.8, 6]} />
        <meshStandardMaterial color={tronTheme.glass} emissive={color} emissiveIntensity={0.9} metalness={0.62} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.88, 0]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.6} roughness={0.12} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <torusGeometry args={[0.62, 0.035, 6, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.82} />
      </mesh>
    </group>
  );
});
