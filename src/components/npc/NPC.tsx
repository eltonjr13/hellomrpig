import { memo, useMemo } from "react";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { NPC as NPCState } from "../../npc/types";
import { useGameStore } from "../../store/useGameStore";
import { useNPCStore } from "../../store/useNPCStore";
import { roleGlowColors } from "../../theme/tronTheme";

type NPCProps = {
  npc: NPCState;
};

export const NPC = memo(function NPC({ npc }: NPCProps) {
  const selectNPC = useNPCStore((state) => state.selectNPC);
  const radius = useGameStore((state) => state.currentWorld.radius);
  const quaternion = useMemo(() => getSurfaceQuaternion(npc, radius), [npc.position.x, npc.position.y, npc.position.z, radius]);
  const roleColor = roleGlowColors[npc.societyRole?.type ?? "wanderer"] ?? roleGlowColors.wanderer;

  return (
    <group
      name={`npc-${npc.id}`}
      position={[npc.position.x, npc.position.y, npc.position.z]}
      quaternion={quaternion}
      onClick={(event) => {
        event.stopPropagation();
        selectNPC(npc.id);
      }}
    >
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.34, 1.18, 6, 12]} />
        <meshStandardMaterial color={getMoodColor(npc.mood.current)} emissive={roleColor} emissiveIntensity={0.35} roughness={0.54} />
      </mesh>
      <mesh castShadow position={[0, 1.04, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#233a2d" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.46, 0.52, 24]} />
        <meshBasicMaterial color={roleColor} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <ringGeometry args={[0.26, 0.3, 18]} />
        <meshBasicMaterial color={getActionColor(npc.currentAction)} />
      </mesh>
    </group>
  );
});

function getSurfaceQuaternion(npc: NPCState, radius: number) {
  const center = new Vector3(0, -radius, 0);
  const position = new Vector3(npc.position.x, npc.position.y, npc.position.z);
  const up = position.sub(center).normalize();
  const forward = new Vector3(npc.targetPosition.x - npc.position.x, npc.targetPosition.y - npc.position.y, npc.targetPosition.z - npc.position.z);

  forward.addScaledVector(up, -forward.dot(up));

  if (forward.lengthSq() < 0.0001) {
    forward.crossVectors(Math.abs(up.y) < 0.92 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0), up);
  }

  forward.normalize();

  const right = new Vector3().crossVectors(up, forward).normalize();
  const matrix = new Matrix4().makeBasis(right, up, forward);
  return new Quaternion().setFromRotationMatrix(matrix);
}

function getMoodColor(mood: NPCState["mood"]["current"]) {
  if (mood === "happy") return "#74c69d";
  if (mood === "angry") return "#ef476f";
  if (mood === "sad") return "#6c8ebf";
  if (mood === "afraid") return "#f4a261";
  if (mood === "excited") return "#ffd166";
  return "#cdb4db";
}

function getActionColor(action: NPCState["currentAction"]) {
  if (action === "avoid_player" || action === "go_to_safe_place") return "#ff6b35";
  if (action === "approach_player" || action === "follow_player") return "#4dabf7";
  if (action === "rest") return "#b197fc";
  if (action === "explore_area") return "#69db7c";
  if (action === "protect") return "#ff3f71";
  return "#f8f9fa";
}
