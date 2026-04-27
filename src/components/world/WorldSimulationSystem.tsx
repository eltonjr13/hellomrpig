import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ResourceNodeMesh } from "./ResourceNodeMesh";
import { BuildingMesh } from "../village/BuildingMesh";
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
      <group name="villages">
        {societies.map((society) => (
          <mesh
            key={society.id}
            position={[society.territoryCenter.x, society.territoryCenter.y + 0.04, society.territoryCenter.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[society.territoryRadius * 0.96, society.territoryRadius, 96]} />
            <meshBasicMaterial color="#74c69d" transparent opacity={0.28} />
          </mesh>
        ))}
        {villages.flatMap((village) =>
          village.buildings.map((building) => <BuildingMesh key={building.id} building={building} />),
        )}
      </group>
    </group>
  );
});
