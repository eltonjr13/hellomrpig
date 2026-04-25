import { memo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Group, Vector3 } from "three";
import { usePlayerControls } from "../../hooks/usePlayerControls";
import { useGameStore } from "../../store/useGameStore";
import { PLAYER_MODEL_TRANSFORM, PlayerModel } from "./PlayerModel";

const PLAYER_SPEED = 4;
const WORLD_LIMIT = 245;

const playerBounds = new Box3();
const objectBounds = new Box3();
const nextPosition = new Vector3();
const movement = new Vector3();
const upAxis = new Vector3(0, 1, 0);
const playerBoxSize = new Vector3(0.85, 1.8, 0.85);
const playerBoxOffset = new Vector3(0, 0.9, 0);

type PlayerProps = {
  debug?: boolean;
};

export const Player = memo(function Player({ debug = false }: PlayerProps) {
  const groupRef = useRef<Group>(null);
  const isWalkingRef = useRef(false);
  const [isWalking, setIsWalking] = useState(false);
  const { inputRef, cameraYawRef } = usePlayerControls();

  useFrame((state, delta) => {
    const player = groupRef.current;
    if (!player) return;

    movement.set(0, 0, 0);
    const input = inputRef.current;

    if (input.forward) movement.z -= 1;
    if (input.backward) movement.z += 1;
    if (input.left) movement.x -= 1;
    if (input.right) movement.x += 1;

    let didMove = false;

    if (movement.lengthSq() > 0) {
      movement.normalize().applyAxisAngle(upAxis, cameraYawRef.current);
      nextPosition.copy(player.position).addScaledVector(movement, Math.min(delta, 0.04) * PLAYER_SPEED);
      nextPosition.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, nextPosition.x));
      nextPosition.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, nextPosition.z));

      playerBounds.setFromCenterAndSize(nextPosition.clone().add(playerBoxOffset), playerBoxSize);

      let blocked = false;
      state.scene.traverse((object) => {
        if (blocked || !object.userData.collision) return;
        objectBounds.setFromObject(object);
        blocked = playerBounds.intersectsBox(objectBounds);
      });

      if (!blocked) {
        player.position.copy(nextPosition);
        player.rotation.y = Math.atan2(movement.x, movement.z);
        didMove = true;
      }
    }

    if (isWalkingRef.current !== didMove) {
      isWalkingRef.current = didMove;
      setIsWalking(didMove);
    }

    useGameStore
      .getState()
      .setPlayerTransform([player.position.x, player.position.y, player.position.z], player.rotation.y, didMove);
  });

  return (
    <group ref={groupRef} name="player" position={[0, 0, 0]}>
      <PlayerModel transform={PLAYER_MODEL_TRANSFORM} isWalking={isWalking} debug={debug} />
      {/* Mixamo pipeline: add idle/run clips later and blend actions in PlayerModel with the same mixer. */}
      {/* Movement still translates/rotates this root group; skeletal animation only affects the loaded FBX. */}
    </group>
  );
});
