import { memo } from "react";
import type { Structure } from "../../simulation/village/types";
import { tronTheme } from "../../theme/tronTheme";

export const LogicLabMesh = memo(function LogicLabMesh({ structure, color }: { structure: Structure; color: string }) {
  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh castShadow receiveShadow position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.92, 1.08, 0.82, 6]} />
        <meshStandardMaterial color={tronTheme.glass} emissive={color} emissiveIntensity={0.85} metalness={0.48} roughness={0.18} />
      </mesh>
      <mesh castShadow position={[0, 1.02, 0]}>
        <icosahedronGeometry args={[0.56, 0]} />
        <meshStandardMaterial color={tronTheme.panel} emissive={color} emissiveIntensity={1.8} metalness={0.36} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <torusGeometry args={[0.76, 0.025, 6, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.78} />
      </mesh>
    </group>
  );
});
