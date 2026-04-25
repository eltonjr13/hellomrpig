import { memo } from "react";

export const Ground = memo(function Ground() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[500, 500, 64, 64]} />
      <meshStandardMaterial color="#1B4332" roughness={0.92} metalness={0.02} />
    </mesh>
  );
});
