import { memo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Group, Scene, Vector3 } from "three";
import { usePlayerControls } from "../../hooks/usePlayerControls";
import { useGameStore } from "../../store/useGameStore";
import { PLAYABLE_CHARACTERS, PlayerModel, type PlayerAnimationState } from "./PlayerModel";

const WALK_SPEED = 4;
const RUN_SPEED = 6.8;
const MOVE_ACCELERATION = 12;
const MOVE_DECELERATION = 14;
const TURN_SPEED = 12;
const JUMP_VELOCITY = 7.5;
const GRAVITY = 22;
const GROUND_Y = 0;
const WORLD_LIMIT = 245;
const KICK_DURATION = 1.2;

const playerBounds = new Box3();
const objectBounds = new Box3();
const nextPosition = new Vector3();
const slidePosition = new Vector3();
const boundsCenter = new Vector3();
const movement = new Vector3();
const desiredVelocity = new Vector3();
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
  const horizontalVelocityRef = useRef(new Vector3());
  const verticalVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);
  const wasJumpPressedRef = useRef(false);
  const wasActionOnePressedRef = useRef(false);
  const wasActionTwoPressedRef = useRef(false);
  const wasSwitchCharacterPressedRef = useRef(false);
  const wasToggleCameraPressedRef = useRef(false);
  const lockedActionRef = useRef<"kick" | "dance" | null>(null);
  const lockedActionTimerRef = useRef(0);
  const [animationState, setAnimationState] = useState<PlayerAnimationState>("idle");
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const initialPlayerPositionRef = useRef(useGameStore.getState().playerPosition);
  const initialPlayerRotationYRef = useRef(useGameStore.getState().playerRotationY);
  const selectedCharacterId = useGameStore((state) => state.selectedCharacterId);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const { inputRef, cameraYawRef } = usePlayerControls();
  const selectedCharacter =
    PLAYABLE_CHARACTERS.find((character) => character.id === selectedCharacterId) ?? PLAYABLE_CHARACTERS[0];

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
    const previousX = player.position.x;
    const previousZ = player.position.z;
    const didPressActionOne = input.actionOne && !wasActionOnePressedRef.current;
    const didPressActionTwo = input.actionTwo && !wasActionTwoPressedRef.current;
    const didPressSwitchCharacter = input.switchCharacter && !wasSwitchCharacterPressedRef.current;
    const didPressToggleCamera = input.toggleCamera && !wasToggleCameraPressedRef.current;
    wasActionOnePressedRef.current = input.actionOne;
    wasActionTwoPressedRef.current = input.actionTwo;
    wasSwitchCharacterPressedRef.current = input.switchCharacter;
    wasToggleCameraPressedRef.current = input.toggleCamera;

    if (didPressSwitchCharacter) {
      useGameStore.getState().cycleSelectedCharacter();
      lockedActionRef.current = null;
    }

    if (didPressToggleCamera) {
      useGameStore.getState().toggleCameraMode();
    }

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

    const hasMoveInput = movement.lengthSq() > 0;

    if (hasMoveInput) {
      if (lockedActionRef.current === "dance") {
        lockedActionRef.current = null;
      }

      movement.normalize().applyAxisAngle(upAxis, cameraYawRef.current);
      desiredVelocity.copy(movement).multiplyScalar(input.run ? RUN_SPEED : WALK_SPEED);
    } else {
      desiredVelocity.set(0, 0, 0);
    }

    const velocitySmoothing = 1 - Math.exp(-(hasMoveInput ? MOVE_ACCELERATION : MOVE_DECELERATION) * frameDelta);
    horizontalVelocityRef.current.lerp(desiredVelocity, velocitySmoothing);

    if (horizontalVelocityRef.current.lengthSq() < 0.01) {
      horizontalVelocityRef.current.set(0, 0, 0);
    }

    if (horizontalVelocityRef.current.lengthSq() > 0) {
      nextPosition.copy(player.position).addScaledVector(horizontalVelocityRef.current, frameDelta);
      nextPosition.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, nextPosition.x));
      nextPosition.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, nextPosition.z));

      if (canOccupyPosition(state.scene, nextPosition)) {
        player.position.x = nextPosition.x;
        player.position.z = nextPosition.z;
      } else {
        slidePosition.set(nextPosition.x, player.position.y, player.position.z);
        if (canOccupyPosition(state.scene, slidePosition)) {
          player.position.x = slidePosition.x;
          horizontalVelocityRef.current.z = 0;
        } else {
          horizontalVelocityRef.current.x = 0;
        }

        slidePosition.set(player.position.x, player.position.y, nextPosition.z);
        if (canOccupyPosition(state.scene, slidePosition)) {
          player.position.z = slidePosition.z;
          horizontalVelocityRef.current.x *= 0.65;
        } else {
          horizontalVelocityRef.current.z = 0;
        }
      }

      didMove = Math.abs(player.position.x - previousX) + Math.abs(player.position.z - previousZ) > 0.002;

      if (didMove) {
        const targetRotation = Math.atan2(horizontalVelocityRef.current.x, horizontalVelocityRef.current.z);
        player.rotation.y = lerpAngle(player.rotation.y, targetRotation, 1 - Math.exp(-TURN_SPEED * frameDelta));
      }
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
    <group
      ref={groupRef}
      name="player"
      position={initialPlayerPositionRef.current}
      rotation={[0, initialPlayerRotationYRef.current, 0]}
    >
      <PlayerModel
        transform={selectedCharacter.transform}
        animationState={animationState}
        animationSpeed={animationSpeed}
        debug={debug}
        visible={cameraMode !== "firstPerson"}
      />
      {/* Mixamo pipeline: add Idle/Fall/Land clips later and blend actions in PlayerModel with the same mixer. */}
      {/* Movement still translates/rotates this root group; skeletal animation only affects the loaded FBX. */}
    </group>
  );
});

function canOccupyPosition(scene: Scene, position: Vector3) {
  playerBounds.setFromCenterAndSize(boundsCenter.copy(position).add(playerBoxOffset), playerBoxSize);

  let blocked = false;
  scene.traverse((object) => {
    if (blocked || !object.userData.collision) return;
    objectBounds.setFromObject(object);
    blocked = playerBounds.intersectsBox(objectBounds);
  });

  return !blocked;
}

function lerpAngle(from: number, to: number, t: number) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}
