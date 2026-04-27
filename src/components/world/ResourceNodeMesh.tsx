import { memo } from "react";
import type { ResourceNode } from "../../simulation/resources/types";

export const ResourceNodeMesh = memo(function ResourceNodeMesh({ node }: { node: ResourceNode }) {
  const opacity = Math.max(0.25, node.amount / node.maxAmount);

  return (
    <group position={[node.position.x, node.position.y, node.position.z]} scale={0.8 + opacity * 0.7}>
      {node.type === "wood" ? (
        <>
          <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 0.9, 8]} />
            <meshStandardMaterial color="#6f4e37" />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.08, 0]}>
            <sphereGeometry args={[0.44, 12, 10]} />
            <meshStandardMaterial color="#2d6a4f" transparent opacity={opacity} />
          </mesh>
        </>
      ) : node.type === "stone" || node.type === "metal" ? (
        <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
          <dodecahedronGeometry args={[0.48, 0]} />
          <meshStandardMaterial color={node.type === "metal" ? "#adb5bd" : "#6c757d"} metalness={node.type === "metal" ? 0.35 : 0} />
        </mesh>
      ) : node.type === "water" ? (
        <mesh receiveShadow position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.06, 24]} />
          <meshStandardMaterial color="#4dabf7" transparent opacity={0.72} />
        </mesh>
      ) : (
        <mesh castShadow receiveShadow position={[0, 0.24, 0]}>
          <sphereGeometry args={[0.34, 10, 8]} />
          <meshStandardMaterial color={node.type === "food" ? "#95d5b2" : "#d8f3dc"} transparent opacity={opacity} />
        </mesh>
      )}
    </group>
  );
});
