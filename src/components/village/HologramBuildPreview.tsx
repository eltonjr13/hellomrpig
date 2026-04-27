import { memo } from "react";
import type { Structure } from "../../simulation/village/types";
import { tronTheme } from "../../theme/tronTheme";

type HologramBuildPreviewProps = {
  structure: Structure;
  color: string;
};

export const HologramBuildPreview = memo(function HologramBuildPreview({ structure, color }: HologramBuildPreviewProps) {
  const height = Math.max(0.22, 1.4 * (structure.status === "building" ? structure.progress / 100 : 0.35));

  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh position={[0, height * 0.48, 0]}>
        <boxGeometry args={[1.65, height, 1.65]} />
        <meshStandardMaterial color={tronTheme.hologram} emissive={color} emissiveIntensity={1.5} transparent opacity={0.22} wireframe />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1.02, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, height + 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.56, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.68} />
      </mesh>
    </group>
  );
});
