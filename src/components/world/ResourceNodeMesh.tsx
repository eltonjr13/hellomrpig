import { memo } from "react";
import type { ResourceNode } from "../../simulation/resources/types";
import { resourceColors, tronTheme } from "../../theme/tronTheme";

export const ResourceNodeMesh = memo(function ResourceNodeMesh({ node }: { node: ResourceNode }) {
  const opacity = Math.max(0.25, node.amount / node.maxAmount);
  const color = resourceColors[node.type];

  return (
    <group position={[node.position.x, node.position.y, node.position.z]} scale={0.8 + opacity * 0.7}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.78, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.52 * opacity} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        {node.type === "core" ? <icosahedronGeometry args={[0.44, 0]} /> : <octahedronGeometry args={[0.46, 0]} />}
        <meshStandardMaterial
          color={node.type === "matter" ? tronTheme.panel : color}
          emissive={color}
          emissiveIntensity={node.type === "matter" ? 0.8 : 1.8}
          metalness={node.type === "matter" ? 0.45 : 0.2}
          roughness={0.28}
          transparent
          opacity={0.68 + opacity * 0.28}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <torusGeometry args={[0.64, 0.025, 6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85 * opacity} />
      </mesh>
    </group>
  );
});
