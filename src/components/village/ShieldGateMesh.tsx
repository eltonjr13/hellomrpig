import { memo } from "react";
import type { Structure } from "../../simulation/village/types";
import { tronTheme } from "../../theme/tronTheme";

export const ShieldGateMesh = memo(function ShieldGateMesh({ structure, color }: { structure: Structure; color: string }) {
  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh castShadow receiveShadow position={[-0.48, 0.72, 0]}>
        <boxGeometry args={[0.22, 1.44, 0.34]} />
        <meshStandardMaterial color={tronTheme.panel} emissive={color} emissiveIntensity={1.1} metalness={0.48} roughness={0.22} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.48, 0.72, 0]}>
        <boxGeometry args={[0.22, 1.44, 0.34]} />
        <meshStandardMaterial color={tronTheme.panel} emissive={color} emissiveIntensity={1.1} metalness={0.48} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <torusGeometry args={[0.7, 0.03, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.84} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <circleGeometry args={[0.62, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} />
      </mesh>
    </group>
  );
});
