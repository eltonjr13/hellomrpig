import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MockAiEngine } from "../ai/aiEngine";
import { useGameStore } from "../store/useGameStore";

export const NpcSystem = memo(function NpcSystem() {
  const npcs = useGameStore((state) => state.npcs);
  const aiEngine = useMemo(() => new MockAiEngine(), []);
  const lastDecisionAtRef = useRef(0);

  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastDecisionAtRef.current < 3) return;
    lastDecisionAtRef.current = clock.elapsedTime;

    const state = useGameStore.getState();
    for (const npc of state.npcs) {
      void aiEngine
        .decideNpcAction({
          npc,
          playerPosition: state.playerPosition,
          nearbyEvents: [],
        })
        .then((decision) => state.updateNpcMood(npc.id, decision.nextMood));
    }
  });

  return (
    <group name="npc-system">
      {npcs.map((npc) => (
        <group key={npc.id} position={npc.position}>
          <mesh castShadow receiveShadow>
            <capsuleGeometry args={[0.35, 1.2, 6, 12]} />
            <meshStandardMaterial color={npc.mood === "curious" ? "#f7d154" : "#8fd6a6"} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#233a2d" />
          </mesh>
        </group>
      ))}
    </group>
  );
});
