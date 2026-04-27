import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ResourceNodeMesh } from "./ResourceNodeMesh";
import { BuildingMesh } from "../village/BuildingMesh";
import { NeonPathMesh } from "../village/NeonPathMesh";
import { NeonGridGround } from "./NeonGridGround";
import { useGameStore } from "../../store/useGameStore";
import { useNPCStore } from "../../store/useNPCStore";
import { useWorldSimulationStore } from "../../store/useWorldSimulationStore";

export const WorldSimulationSystem = memo(function WorldSimulationSystem() {
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const currentWorld = useGameStore((state) => state.currentWorld);
  const resources = useWorldSimulationStore((state) => state.resources);
  const societies = useWorldSimulationStore((state) => state.societies);
  const villages = useWorldSimulationStore((state) => state.villages);
  const initialize = useWorldSimulationStore((state) => state.initialize);
  const tick = useWorldSimulationStore((state) => state.tick);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    initialize(currentPlanet.id, currentWorld.radius);
  }, [currentPlanet.id, currentWorld.radius, initialize]);

  useFrame((_, delta) => {
    accumulatorRef.current += delta;
    if (accumulatorRef.current < 1) return;
    accumulatorRef.current = 0;

    tick({
      planetId: useGameStore.getState().currentPlanet.id,
      radius: useGameStore.getState().currentWorld.radius,
      npcs: useNPCStore.getState().npcs,
      setNPCs: useNPCStore.getState().setNPCs,
    });
  });

  return (
    <group name="world-simulation">
      <group name="resource-nodes">
        {resources.map((node) => (
          <ResourceNodeMesh key={node.id} node={node} />
        ))}
      </group>
      <group name="digital-settlements">
        {societies.map((society) => (
          <mesh
            key={society.id}
            position={[society.territoryCenter.x, society.territoryCenter.y + 0.04, society.territoryCenter.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[society.territoryRadius * 0.96, society.territoryRadius, 96]} />
            <meshBasicMaterial color={society.neonColor} transparent opacity={0.22} />
          </mesh>
        ))}
        {villages.map((settlement) => (
          <NeonGridGround key={`${settlement.id}-grid`} position={settlement.position} radius={Math.min(18, 8 + settlement.level * 3.5)} color={settlement.neonColor} />
        ))}
        {villages.flatMap((settlement) =>
          settlement.paths.map((path) => <NeonPathMesh key={path.id} path={path} />),
        )}
        {villages.flatMap((settlement) =>
          settlement.structures.map((structure) => (
            <BuildingMesh
              key={structure.id}
              building={structure}
              color={settlement.neonColor}
              energyRatio={Math.max(0.08, Math.min(1, settlement.storage.energy / 140))}
            />
          )),
        )}
      </group>
    </group>
  );
});
