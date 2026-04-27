import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Structure } from "../../simulation/village/types";
import { Text } from "@react-three/drei";

interface HologramBuildingMeshProps {
  structure: Structure;
  color?: string;
}

export function HologramBuildingMesh({ structure, color = "#00ffff" }: HologramBuildingMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.getElapsedTime();
    // Efeito de escaneamento do holograma
    materialRef.current.opacity = 0.4 + Math.sin(time * 3 + structure.position.x) * 0.2;
    meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
  });

  return (
    <group ref={meshRef} position={[structure.position.x, structure.position.y, structure.position.z]}>
      {/* Geometria base do holograma, varia com o tipo. Para simplificar, um box ou cylinder */}
      <mesh position={[0, 1, 0]}>
        {structure.type === "energy_tower" ? (
          <cylinderGeometry args={[0.5, 0.8, 4]} />
        ) : structure.type === "core_node" ? (
          <octahedronGeometry args={[2]} />
        ) : (
          <boxGeometry args={[2, 2, 2]} />
        )}
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.5}
          wireframe
        />
      </mesh>
      
      {/* Label de planejamento se não for o caminho */}
      {structure.type !== "neon_path" && (
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.4}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {`[PLANNED: ${structure.type.toUpperCase()}]`}
        </Text>
      )}
    </group>
  );
}
