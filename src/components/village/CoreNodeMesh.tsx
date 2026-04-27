import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { Structure } from "../../simulation/village/types";
import { tronTheme } from "../../theme/tronTheme";

type CoreNodeMeshProps = {
  structure: Structure;
  color: string;
  energyRatio: number;
};

export const CoreNodeMesh = memo(function CoreNodeMesh({ structure, color, energyRatio }: CoreNodeMeshProps) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * (1.8 + energyRatio * 2.4)) * 0.05;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <group ref={ref} position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <octahedronGeometry args={[0.92, 1]} />
        <meshStandardMaterial
          color={tronTheme.glass}
          emissive={color}
          emissiveIntensity={1.2 + energyRatio * 2.6}
          metalness={0.55}
          roughness={0.18}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <torusGeometry args={[1.12, 0.04, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.28, 1.42, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.5 + energyRatio * 0.35} />
      </mesh>
    </group>
  );
});
