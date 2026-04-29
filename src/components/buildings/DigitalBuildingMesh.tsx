import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Structure } from "../../simulation/village/types";
import { Text } from "@react-three/drei";

interface DigitalBuildingMeshProps {
  structure: Structure;
  color?: string;
}

export function DigitalBuildingMesh({ structure, color = "#00ffff" }: DigitalBuildingMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const progressRef = useRef<THREE.MeshBasicMaterial>(null);

  const isBuilding = structure.status === "building";
  const activeWorkerCount = structure.activeWorkers?.length ?? 0;

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    if (isBuilding) {
      // Efeito de pulso durante a construção
      const time = state.clock.getElapsedTime();
      materialRef.current.emissiveIntensity = 0.5 + Math.sin(time * 5) * 0.5;
    } else {
      // Estável quando completo
      materialRef.current.emissiveIntensity = 1.2;
    }
  });

  return (
    <group ref={meshRef} position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh position={[0, structure.type === "core_node" ? 8 : structure.type === "energy_tower" ? 2 : 1, 0]} castShadow receiveShadow>
        {structure.type === "energy_tower" ? (
          <cylinderGeometry args={[0.5, 0.8, 4]} />
        ) : structure.type === "core_node" ? (
          <boxGeometry args={[4, 16, 4]} />
        ) : (
          <boxGeometry args={[2, 2, 2]} />
        )}
        <meshStandardMaterial
          ref={materialRef}
          color={isBuilding ? "#555" : color}
          emissive={color}
          emissiveIntensity={isBuilding ? 0.5 : 1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {isBuilding && (
        <group position={[0, structure.type === "core_node" ? 17 : structure.type === "energy_tower" ? 4.5 : 2.5, 0]}>
          <mesh>
            <planeGeometry args={[2, 0.2]} />
            <meshBasicMaterial color="#333" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-1 + (structure.progress / 100), 0, 0.01]}>
            <planeGeometry args={[2 * (structure.progress / 100), 0.2]} />
            <meshBasicMaterial ref={progressRef} color={color} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[0, 0.4, 0]}
            fontSize={0.3}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {`${Math.floor(structure.progress)}%`}
          </Text>
        </group>
      )}
      {isBuilding && activeWorkerCount > 0 ? (
        <group position={[0, 0.08, 0]}>
          {Array.from({ length: Math.min(activeWorkerCount, 6) }, (_, index) => {
            const angle = (index / Math.min(activeWorkerCount, 6)) * Math.PI * 2;
            return (
              <mesh key={`${structure.id}-worker-${index}`} position={[Math.cos(angle) * 1.75, 0.06, Math.sin(angle) * 1.75]}>
                <sphereGeometry args={[0.12, 10, 10]} />
                <meshStandardMaterial color="#ffd43b" emissive={color} emissiveIntensity={1.6} roughness={0.25} />
              </mesh>
            );
          })}
        </group>
      ) : null}
    </group>
  );
}
