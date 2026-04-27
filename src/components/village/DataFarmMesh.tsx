import { memo } from "react";
import type { Structure } from "../../simulation/village/types";
import { tronTheme } from "../../theme/tronTheme";

export const DataFarmMesh = memo(function DataFarmMesh({ structure, color }: { structure: Structure; color: string }) {
  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      {[-0.52, 0, 0.52].map((x, index) => (
        <mesh key={x} castShadow receiveShadow position={[x, 0.46 + index * 0.12, 0]}>
          <boxGeometry args={[0.3, 0.92 + index * 0.18, 0.82]} />
          <meshStandardMaterial color={tronTheme.panel} emissive={color} emissiveIntensity={0.75 + index * 0.35} metalness={0.4} roughness={0.26} />
        </mesh>
      ))}
      <mesh position={[0, 1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.84, 0.92, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.62} />
      </mesh>
    </group>
  );
});
