import { memo } from "react";
import { useGameStore, type SpawnObject } from "../store/useGameStore";

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
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={object.color} roughness={0.78} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.68, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.78, 0.55, 4]} />
            <meshStandardMaterial color="#6d3f2a" roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.18, -0.51]}>
            <boxGeometry args={[0.22, 0.36, 0.03]} />
            <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
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
          <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.6, 0.68, 0.5, 18]} />
            <meshStandardMaterial color={object.color} roughness={0.9} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.62, 0]}>
            <torusGeometry args={[0.52, 0.08, 8, 18]} />
            <meshStandardMaterial color="#ced4da" roughness={0.8} />
          </mesh>
        </>
      );
    case "market":
      return (
        <>
          <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[1, 0.55, 1]} />
            <meshStandardMaterial color="#d8f3dc" roughness={0.72} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.38, 0]}>
            <boxGeometry args={[1.12, 0.12, 1.1]} />
            <meshStandardMaterial color={object.color} roughness={0.65} />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.36, 0.05, -0.35]}>
            <boxGeometry args={[0.08, 0.68, 0.08]} />
            <meshStandardMaterial color="#6d4c41" roughness={0.8} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.36, 0.05, -0.35]}>
            <boxGeometry args={[0.08, 0.68, 0.08]} />
            <meshStandardMaterial color="#6d4c41" roughness={0.8} />
          </mesh>
        </>
      );
    case "field":
      return (
        <>
          <mesh receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={object.color} roughness={0.95} />
          </mesh>
          {[-0.32, 0, 0.32].map((x) => (
            <mesh key={x} receiveShadow position={[x, 0.56, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.9]} />
              <meshStandardMaterial color="#5a7d2a" roughness={0.9} />
            </mesh>
          ))}
        </>
      );
    case "path":
      return (
        <mesh receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={object.color} roughness={0.96} />
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
          <meshStandardMaterial color={object.color} roughness={0.8} />
        </mesh>
      );
  }
}
