import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MineableNode } from "../../simulation/mining/types";

interface MineableNodeMeshProps {
  node: MineableNode;
}

const colorMap = {
  energy: "#00e5ff",
  matter: "#ffaa00",
  data: "#ff00ff",
  crystal: "#ffffff",
  signal: "#00ff00",
};

export function MineableNodeMesh({ node }: MineableNodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    const healthRatio = Math.max(0, node.health / node.maxHealth);
    
    // Scale down based on health
    const scale = 0.5 + healthRatio * 0.5;
    meshRef.current.scale.setScalar(scale);

    // Pulse effect
    const time = state.clock.getElapsedTime();
    const pulse = Math.sin(time * 2 + node.position.x) * 0.5 + 0.5;
    
    materialRef.current.emissiveIntensity = (0.5 + pulse * 1.5) * healthRatio;
  });

  const baseColor = colorMap[node.type] || "#ffffff";
  const isCrystal = node.type === "crystal";

  return (
    <mesh ref={meshRef} position={[node.position.x, node.position.y, node.position.z]} castShadow>
      {isCrystal ? (
        <octahedronGeometry args={[1.2, 0]} />
      ) : (
        <dodecahedronGeometry args={[1, 0]} />
      )}
      <meshStandardMaterial
        ref={materialRef}
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={2}
        roughness={isCrystal ? 0.1 : 0.6}
        metalness={isCrystal ? 0.9 : 0.2}
      />
    </mesh>
  );
}
