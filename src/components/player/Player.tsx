import { memo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Group, Matrix4, Quaternion, Scene, Vector3 } from "three";
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
const KICK_DURATION = 1.2;

const playerBounds = new Box3();
const objectBounds = new Box3();
const nextPosition = new Vector3();
const boundsCenter = new Vector3();
const movement = new Vector3();
const desiredVelocity = new Vector3();
const flatMoveDirection = new Vector3();
const planetCenter = new Vector3();
const surfaceNormal = new Vector3();
const candidateNormal = new Vector3();
const forwardDirection = new Vector3();
const rightDirection = new Vector3();
const correctedForward = new Vector3();
const orientationMatrix = new Matrix4();
const targetQuaternion = new Quaternion();
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
  const headingYawRef = useRef(useGameStore.getState().playerRotationY);
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
    const currentWorld = useGameStore.getState().currentWorld;
    setPlanetCenter(planetCenter, currentWorld.radius);
    setSurfaceNormal(surfaceNormal, planetCenter, player.position);

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

      flatMoveDirection.copy(movement).normalize().applyAxisAngle(upAxis, cameraYawRef.current);
      desiredVelocity
        .copy(flatMoveDirection)
        .addScaledVector(surfaceNormal, -flatMoveDirection.dot(surfaceNormal))
        .normalize()
        .multiplyScalar(input.run ? RUN_SPEED : WALK_SPEED);
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
      projectToPlanetRadius(nextPosition, planetCenter, currentWorld.radius + getSurfaceAltitude(player.position, planetCenter, currentWorld.radius));

      if (canOccupyPosition(state.scene, nextPosition, planetCenter)) {
        player.position.copy(nextPosition);
      } else {
        horizontalVelocityRef.current.set(0, 0, 0);
      }

      didMove = Math.abs(player.position.x - previousX) + Math.abs(player.position.z - previousZ) > 0.002;

      if (didMove) {
        const targetRotation = Math.atan2(horizontalVelocityRef.current.x, horizontalVelocityRef.current.z);
        headingYawRef.current = lerpAngle(headingYawRef.current, targetRotation, 1 - Math.exp(-TURN_SPEED * frameDelta));
      }
    }

    setSurfaceNormal(surfaceNormal, planetCenter, player.position);
    verticalVelocityRef.current -= GRAVITY * frameDelta;
    player.position.addScaledVector(surfaceNormal, verticalVelocityRef.current * frameDelta);
    const altitude = getSurfaceAltitude(player.position, planetCenter, currentWorld.radius);

    if (altitude <= 0) {
      projectToPlanetRadius(player.position, planetCenter, currentWorld.radius);
      verticalVelocityRef.current = 0;
      isGroundedRef.current = true;
    } else {
      isGroundedRef.current = false;
    }

    setSurfaceNormal(surfaceNormal, planetCenter, player.position);
    alignPlayerToPlanetSurface(player, surfaceNormal, headingYawRef.current, frameDelta);

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
      .setPlayerTransform([player.position.x, player.position.y, player.position.z], headingYawRef.current, didMove);
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

function canOccupyPosition(scene: Scene, position: Vector3, center: Vector3) {
  candidateNormal.subVectors(position, center).normalize();
  playerBounds.setFromCenterAndSize(boundsCenter.copy(position).addScaledVector(candidateNormal, playerBoxOffset.y), playerBoxSize);

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

function setPlanetCenter(target: Vector3, radius: number) {
  target.set(0, -radius, 0);
}

function setSurfaceNormal(target: Vector3, center: Vector3, position: Vector3) {
  target.subVectors(position, center);

  if (target.lengthSq() < 0.0001) {
    target.copy(upAxis);
    return target;
  }

  return target.normalize();
}

function getSurfaceAltitude(position: Vector3, center: Vector3, radius: number) {
  return position.distanceTo(center) - radius;
}

function projectToPlanetRadius(position: Vector3, center: Vector3, radius: number) {
  setSurfaceNormal(candidateNormal, center, position);
  position.copy(center).addScaledVector(candidateNormal, radius);
}

function alignPlayerToPlanetSurface(player: Group, normal: Vector3, headingYaw: number, delta: number) {
  forwardDirection.set(Math.sin(headingYaw), 0, Math.cos(headingYaw));
  forwardDirection.addScaledVector(normal, -forwardDirection.dot(normal));

  if (forwardDirection.lengthSq() < 0.0001) {
    forwardDirection.crossVectors(rightDirection.set(1, 0, 0), normal);
  }

  forwardDirection.normalize();
  rightDirection.crossVectors(normal, forwardDirection).normalize();
  correctedForward.crossVectors(rightDirection, normal).normalize();
  orientationMatrix.makeBasis(rightDirection, normal, correctedForward);
  targetQuaternion.setFromRotationMatrix(orientationMatrix);
  player.quaternion.slerp(targetQuaternion, 1 - Math.exp(-TURN_SPEED * delta));
}
