import { memo } from "react";
import { useGameStore } from "../store/useGameStore";

export const SpawnedObjects = memo(function SpawnedObjects() {
  const spawnObjects = useGameStore((state) => state.spawnObjects);

  return (
    <group name="spawned-objects">
      {spawnObjects.map((object) => (
        <mesh
          key={object.id}
          castShadow
          receiveShadow
          position={object.position}
          scale={object.scale}
          userData={{ collision: "box", type: object.type }}
        >
          {object.type === "marker" ? <coneGeometry args={[0.35, 1.4, 8]} /> : <boxGeometry />}
          <meshStandardMaterial color={object.color} roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
});
