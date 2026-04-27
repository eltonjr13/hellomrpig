import { memo } from "react";
import { useGameStore, type SpawnObject } from "../store/useGameStore";
import { tronTheme } from "../theme/tronTheme";

export const SpawnedObjects = memo(function SpawnedObjects() {
  const spawnObjects = useGameStore((state) => state.spawnObjects);

  return (
    <group name="spawned-objects">
      {spawnObjects.map((object) => (
        <SimulationObject key={object.id} object={object} />
      ))}
    </group>
  );
});

function SimulationObject({ object }: { object: SpawnObject }) {
  return (
    <group
      position={object.position}
      rotation={[0, object.rotationY ?? 0, 0]}
      scale={object.scale}
      userData={{ collision: object.collision === false ? undefined : "box", type: object.type }}
    >
      {renderObjectGeometry(object)}
    </group>
  );
}

function renderObjectGeometry(object: SpawnObject) {
  switch (object.type) {
    case "house":
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
            <capsuleGeometry args={[0.34, 0.72, 4, 10]} />
            <meshStandardMaterial color={tronTheme.glass} emissive={object.color} emissiveIntensity={0.7} metalness={0.38} roughness={0.22} />
          </mesh>
          <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.52, 0.6, 28]} />
            <meshBasicMaterial color={object.color} transparent opacity={0.7} />
          </mesh>
        </>
      );
    case "tree":
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 1.1, 8]} />
            <meshStandardMaterial color="#6f4e37" roughness={0.85} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.35, 0]}>
            <sphereGeometry args={[0.68, 14, 12]} />
            <meshStandardMaterial color={object.color} roughness={0.78} />
          </mesh>
        </>
      );
    case "well":
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
            <octahedronGeometry args={[0.48, 0]} />
            <meshStandardMaterial color={tronTheme.glass} emissive={object.color} emissiveIntensity={1.7} metalness={0.46} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <torusGeometry args={[0.68, 0.035, 8, 36]} />
            <meshBasicMaterial color={object.color} transparent opacity={0.86} />
          </mesh>
        </>
      );
    case "market":
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.58, 0.72, 0.52, 12]} />
            <meshStandardMaterial color={tronTheme.panel} emissive={object.color} emissiveIntensity={0.8} metalness={0.44} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <torusGeometry args={[0.74, 0.035, 8, 42]} />
            <meshBasicMaterial color={object.color} transparent opacity={0.8} />
          </mesh>
        </>
      );
    case "field":
      return (
        <>
          <mesh receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={tronTheme.ground} emissive={object.color} emissiveIntensity={0.24} roughness={0.36} metalness={0.28} />
          </mesh>
          {[-0.32, 0, 0.32].map((x) => (
            <mesh key={x} receiveShadow position={[x, 0.56, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.9]} />
              <meshBasicMaterial color={object.color} transparent opacity={0.74} />
            </mesh>
          ))}
        </>
      );
    case "path":
      return (
        <mesh receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={tronTheme.ground} emissive={object.color} emissiveIntensity={0.32} roughness={0.42} metalness={0.34} />
        </mesh>
      );
    case "rock":
      return (
        <mesh castShadow receiveShadow>
          <dodecahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial color={object.color} roughness={0.88} />
        </mesh>
      );
    case "storage":
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={tronTheme.panel} emissive={object.color} emissiveIntensity={0.9} metalness={0.5} roughness={0.24} />
        </mesh>
      );
  }
}
