import { memo } from "react";

type GroundProps = {
  color?: string;
};

export const Ground = memo(function Ground({ color = "#1B4332" }: GroundProps) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[500, 500, 64, 64]} />
      <meshStandardMaterial color={color} roughness={0.92} metalness={0.02} />
    </mesh>
  );
});
