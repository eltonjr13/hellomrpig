import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { NPCManager } from "../npc/NPCManager";
import { NPC } from "./npc/NPC";
import { useGameStore } from "../store/useGameStore";
import { useNPCStore } from "../store/useNPCStore";
import type { NPCWorldState } from "../npc/types";

const UPDATE_INTERVAL_SECONDS = 0.25;

export const NpcSystem = memo(function NpcSystem() {
  const currentPlanet = useGameStore((state) => state.currentPlanet);
  const currentWorld = useGameStore((state) => state.currentWorld);
  const baseNpcs = useGameStore((state) => state.npcs);
  const npcs = useNPCStore((state) => state.npcs);
  const loadPlanetNPCs = useNPCStore((state) => state.loadPlanetNPCs);
  const setNPCs = useNPCStore((state) => state.setNPCs);
  const manager = useMemo(() => new NPCManager(), []);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    loadPlanetNPCs(currentPlanet.id, baseNpcs, currentWorld.radius);
  }, [baseNpcs, currentPlanet.id, currentWorld.radius, loadPlanetNPCs]);

  useFrame((_, delta) => {
    accumulatorRef.current += delta;
    if (accumulatorRef.current < UPDATE_INTERVAL_SECONDS) return;

    const step = accumulatorRef.current;
    accumulatorRef.current = 0;

    const gameState = useGameStore.getState();
    const npcState = useNPCStore.getState();
    if (npcState.npcs.length === 0) return;

    const worldState: NPCWorldState = {
      planetId: gameState.currentPlanet.id,
      planetRadius: gameState.currentWorld.radius,
      now: Date.now(),
      delta: step,
      player: {
        id: "local-player",
        position: {
          x: gameState.playerPosition[0],
          y: gameState.playerPosition[1],
          z: gameState.playerPosition[2],
        },
      },
      npcs: npcState.npcs,
    };

    setNPCs(manager.update(npcState.npcs, worldState));
  });

  return (
    <group name="npc-system">
      {npcs.map((npc) => (
        <NPC key={npc.id} npc={npc} />
      ))}
    </group>
  );
});
