import { memo } from "react";
import type { NPCPosition } from "../../npc/types";
import { tronTheme } from "../../theme/tronTheme";

type NeonGridGroundProps = {
  position: NPCPosition;
  radius: number;
  color: string;
};

export const NeonGridGround = memo(function NeonGridGround({ position, radius, color }: NeonGridGroundProps) {
  const rings = [0.28, 0.48, 0.68, 0.88];
  const spokes = Array.from({ length: 12 }, (_, index) => (index / 12) * Math.PI * 2);

  return (
    <group position={[position.x, position.y + 0.018, position.z]} name="neon-grid-ground">
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color={tronTheme.ground} roughness={0.35} metalness={0.42} transparent opacity={0.72} />
      </mesh>
      {rings.map((factor) => (
        <mesh key={factor} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * factor, radius * factor + 0.04, 96]} />
          <meshBasicMaterial color={color} transparent opacity={0.28} />
        </mesh>
      ))}
      {spokes.map((angle) => (
        <mesh key={angle} position={[Math.cos(angle) * radius * 0.5, 0.012, Math.sin(angle) * radius * 0.5]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[radius, 0.018, 0.035]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} />
        </mesh>
      ))}
    </group>
  );
});
