import { memo } from "react";
import type { Structure } from "../../simulation/village/types";
import { tronTheme } from "../../theme/tronTheme";

export const SocialHubMesh = memo(function SocialHubMesh({ structure, color }: { structure: Structure; color: string }) {
  const pods = Array.from({ length: 6 }, (_, index) => (index / 6) * Math.PI * 2);

  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.76, 0.92, 0.86, 12]} />
        <meshStandardMaterial color={tronTheme.glass} emissive={color} emissiveIntensity={0.8} metalness={0.4} roughness={0.2} />
      </mesh>
      {pods.map((angle) => (
        <mesh key={angle} position={[Math.cos(angle) * 1.05, 0.5, Math.sin(angle) * 1.05]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.14, 1.24, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.72} />
      </mesh>
    </group>
  );
});
