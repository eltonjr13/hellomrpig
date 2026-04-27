import { useRef } from "react";
import * as THREE from "three";
import type { MineableNode } from "../../simulation/mining/types";

interface DestroyedNodeMeshProps {
  node: MineableNode;
}

export function DestroyedNodeMesh({ node }: DestroyedNodeMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Um visual simples para um nó destruído: algumas pedras ou uma base escura sem brilho
  return (
    <group ref={groupRef} position={[node.position.x, node.position.y - 0.5, node.position.z]}>
      <mesh rotation={[Math.random(), Math.random(), 0]} position={[0.2, 0, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.random(), Math.random(), 0]} position={[-0.2, 0.1, -0.2]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
    </group>
  );
}
