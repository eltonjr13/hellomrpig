import { memo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Group, Vector3 } from "three";
import { usePlayerControls } from "../../hooks/usePlayerControls";
import { useGameStore } from "../../store/useGameStore";
import { PLAYER_MODEL_TRANSFORM, PlayerModel, type PlayerAnimationState } from "./PlayerModel";

const WALK_SPEED = 4;
const RUN_SPEED = 6.8;
const JUMP_VELOCITY = 7.5;
const GRAVITY = 22;
const GROUND_Y = 0;
const WORLD_LIMIT = 245;
const KICK_DURATION = 1.2;

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
  const animationStateRef = useRef<PlayerAnimationState>("idle");
  const animationSpeedRef = useRef(1);
  const verticalVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);
  const wasJumpPressedRef = useRef(false);
  const wasActionOnePressedRef = useRef(false);
  const wasActionTwoPressedRef = useRef(false);
  const lockedActionRef = useRef<"kick" | "dance" | null>(null);
  const lockedActionTimerRef = useRef(0);
  const [animationState, setAnimationState] = useState<PlayerAnimationState>("idle");
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const { inputRef, cameraYawRef } = usePlayerControls();

  useFrame((state, delta) => {
    const player = groupRef.current;
    if (!player) return;
    const frameDelta = Math.min(delta, 0.04);

    movement.set(0, 0, 0);
    const input = inputRef.current;

    if (input.forward) movement.z -= 1;
    if (input.backward) movement.z += 1;
    if (input.left) movement.x -= 1;
    if (input.right) movement.x += 1;

    let didMove = false;
    const didPressActionOne = input.actionOne && !wasActionOnePressedRef.current;
    const didPressActionTwo = input.actionTwo && !wasActionTwoPressedRef.current;
    wasActionOnePressedRef.current = input.actionOne;
    wasActionTwoPressedRef.current = input.actionTwo;

    if (didPressActionOne && isGroundedRef.current) {
      lockedActionRef.current = "kick";
      lockedActionTimerRef.current = KICK_DURATION;
    }

    if (didPressActionTwo && isGroundedRef.current) {
      lockedActionRef.current = lockedActionRef.current === "dance" ? null : "dance";
      lockedActionTimerRef.current = 0;
    }

    if (lockedActionRef.current === "kick") {
      lockedActionTimerRef.current = Math.max(0, lockedActionTimerRef.current - frameDelta);
      if (lockedActionTimerRef.current === 0) {
        lockedActionRef.current = null;
      }
    }

    const didJump = input.jump && !wasJumpPressedRef.current && isGroundedRef.current;
    wasJumpPressedRef.current = input.jump;

    if (didJump) {
      verticalVelocityRef.current = JUMP_VELOCITY;
      isGroundedRef.current = false;
    }

    verticalVelocityRef.current -= GRAVITY * frameDelta;
    const nextY = player.position.y + verticalVelocityRef.current * frameDelta;

    if (nextY <= GROUND_Y) {
      player.position.y = GROUND_Y;
      verticalVelocityRef.current = 0;
      isGroundedRef.current = true;
    } else {
      player.position.y = nextY;
      isGroundedRef.current = false;
    }

    if (movement.lengthSq() > 0) {
      if (lockedActionRef.current === "dance") {
        lockedActionRef.current = null;
      }

      movement.normalize().applyAxisAngle(upAxis, cameraYawRef.current);
      nextPosition
        .copy(player.position)
        .addScaledVector(movement, frameDelta * (input.run ? RUN_SPEED : WALK_SPEED));
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
        player.position.x = nextPosition.x;
        player.position.z = nextPosition.z;
        player.rotation.y = Math.atan2(movement.x, movement.z);
        didMove = true;
      }
    }

    const nextAnimationState: PlayerAnimationState =
      lockedActionRef.current && isGroundedRef.current
        ? lockedActionRef.current
        : !isGroundedRef.current
          ? verticalVelocityRef.current > 0
            ? "jump"
            : "fall"
          : didMove
            ? input.run
              ? "run"
              : "walk"
            : "idle";
    const nextAnimationSpeed = input.run ? 1.45 : 1;

    if (animationStateRef.current !== nextAnimationState) {
      animationStateRef.current = nextAnimationState;
      setAnimationState(nextAnimationState);
    }

    if (animationSpeedRef.current !== nextAnimationSpeed) {
      animationSpeedRef.current = nextAnimationSpeed;
      setAnimationSpeed(nextAnimationSpeed);
    }

    useGameStore
      .getState()
      .setPlayerTransform([player.position.x, player.position.y, player.position.z], player.rotation.y, didMove);
  });

  return (
    <group ref={groupRef} name="player" position={[0, 0, 0]}>
      <PlayerModel
        transform={PLAYER_MODEL_TRANSFORM}
        animationState={animationState}
        animationSpeed={animationSpeed}
        debug={debug}
      />
      {/* Mixamo pipeline: add Idle/Fall/Land clips later and blend actions in PlayerModel with the same mixer. */}
      {/* Movement still translates/rotates this root group; skeletal animation only affects the loaded FBX. */}
    </group>
  );
});
