import { memo, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Group, Matrix4, Quaternion, Scene, Vector3 } from "three";
import { usePlayerControls, type PlayerInputState } from "../../hooks/usePlayerControls";
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
const AIRPLANE_CRUISE_SPEED = 54;
const AIRPLANE_TURBO_SPEED = 128;
const AIRPLANE_BRAKE_SPEED = 26;
const AIRPLANE_ACCELERATION = 3.8;
const AIRPLANE_TURN_SPEED = 1.65;
const AIRPLANE_CLIMB_SPEED = 32;
const AIRPLANE_DESCEND_SPEED = -28;
const AIRPLANE_MIN_ALTITUDE = 5.5;
const AIRPLANE_TAKEOFF_ALTITUDE = 9;
const AIRPLANE_CAMERA_DISTANCE = 28;

const playerBounds = new Box3();
const objectBounds = new Box3();
const nextPosition = new Vector3();
const boundsCenter = new Vector3();
const movement = new Vector3();
const desiredVelocity = new Vector3();
const planetCenter = new Vector3();
const surfaceNormal = new Vector3();
const candidateNormal = new Vector3();
const moveForward = new Vector3();
const forwardDirection = new Vector3();
const rightDirection = new Vector3();
const correctedForward = new Vector3();
const orientationMatrix = new Matrix4();
const targetQuaternion = new Quaternion();
const upAxis = new Vector3(0, 1, 0);
const fallbackAxis = new Vector3(1, 0, 0);
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
  const wasToggleFlightPressedRef = useRef(false);
  const lockedActionRef = useRef<"kick" | "dance" | null>(null);
  const lockedActionTimerRef = useRef(0);
  const headingYawRef = useRef(useGameStore.getState().playerRotationY);
  const headingForwardRef = useRef(new Vector3(0, 0, -1));
  const airplaneSpeedRef = useRef(0);
  const [animationState, setAnimationState] = useState<PlayerAnimationState>("idle");
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const initialPlayerPositionRef = useRef(useGameStore.getState().playerPosition);
  const initialPlayerRotationYRef = useRef(useGameStore.getState().playerRotationY);
  const selectedCharacterId = useGameStore((state) => state.selectedCharacterId);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const vehicleMode = useGameStore((state) => state.vehicleMode);
  const { inputRef } = usePlayerControls();
  const selectedCharacter =
    PLAYABLE_CHARACTERS.find((character) => character.id === selectedCharacterId) ?? PLAYABLE_CHARACTERS[0];

  useFrame((state, delta) => {
    const player = groupRef.current;
    if (!player) return;
    const frameDelta = Math.min(delta, 0.04);
    const gameState = useGameStore.getState();
    const currentWorld = gameState.currentWorld;
    setPlanetCenter(planetCenter, currentWorld.radius);
    setSurfaceNormal(surfaceNormal, planetCenter, player.position);
    projectDirectionToSurface(headingForwardRef.current, surfaceNormal);

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
    const didPressToggleFlight = input.toggleFlight && !wasToggleFlightPressedRef.current;
    wasActionOnePressedRef.current = input.actionOne;
    wasActionTwoPressedRef.current = input.actionTwo;
    wasSwitchCharacterPressedRef.current = input.switchCharacter;
    wasToggleCameraPressedRef.current = input.toggleCamera;
    wasToggleFlightPressedRef.current = input.toggleFlight;

    if (didPressSwitchCharacter) {
      useGameStore.getState().cycleSelectedCharacter();
      lockedActionRef.current = null;
    }

    if (didPressToggleCamera) {
      useGameStore.getState().toggleCameraMode();
    }

    let isAirplaneActive = gameState.vehicleMode === "airplane";

    if (didPressToggleFlight) {
      isAirplaneActive = !isAirplaneActive;
      gameState.setVehicleMode(isAirplaneActive ? "airplane" : "onFoot");
      gameState.setCameraDistance(isAirplaneActive ? AIRPLANE_CAMERA_DISTANCE : 9);
      airplaneSpeedRef.current = isAirplaneActive ? Math.max(airplaneSpeedRef.current, AIRPLANE_CRUISE_SPEED) : 0;
      verticalVelocityRef.current = isAirplaneActive ? AIRPLANE_CLIMB_SPEED * 0.45 : verticalVelocityRef.current;
      lockedActionRef.current = null;

      if (isAirplaneActive) {
        projectToPlanetRadius(player.position, planetCenter, currentWorld.radius + AIRPLANE_TAKEOFF_ALTITUDE);
      }
    }

    if (isAirplaneActive) {
      const didFly = updateAirplaneFlight(
        player,
        input,
        currentWorld.radius,
        frameDelta,
        headingForwardRef,
        airplaneSpeedRef,
        verticalVelocityRef,
      );
      setSurfaceNormal(surfaceNormal, planetCenter, player.position);
      alignPlayerToPlanetSurface(player, surfaceNormal, headingForwardRef.current, frameDelta);
      headingYawRef.current = getHeadingYaw(headingForwardRef.current);

      if (animationStateRef.current !== "idle") {
        animationStateRef.current = "idle";
        setAnimationState("idle");
      }

      if (animationSpeedRef.current !== 1) {
        animationSpeedRef.current = 1;
        setAnimationSpeed(1);
      }

      useGameStore
        .getState()
        .setPlayerTransform(
          [player.position.x, player.position.y, player.position.z],
          headingYawRef.current,
          didFly,
          [headingForwardRef.current.x, headingForwardRef.current.y, headingForwardRef.current.z],
        );
      return;
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

      moveForward.copy(headingForwardRef.current);
      projectDirectionToSurface(moveForward, surfaceNormal);
      rightDirection.crossVectors(moveForward, surfaceNormal).normalize();

      desiredVelocity
        .copy(moveForward)
        .multiplyScalar(-movement.z)
        .addScaledVector(rightDirection, movement.x)
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
        headingForwardRef.current.copy(horizontalVelocityRef.current).normalize();
        headingYawRef.current = getHeadingYaw(headingForwardRef.current);
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
    projectDirectionToSurface(headingForwardRef.current, surfaceNormal);
    alignPlayerToPlanetSurface(player, surfaceNormal, headingForwardRef.current, frameDelta);
    headingYawRef.current = getHeadingYaw(headingForwardRef.current);

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
      .setPlayerTransform(
        [player.position.x, player.position.y, player.position.z],
        headingYawRef.current,
        didMove,
        [headingForwardRef.current.x, headingForwardRef.current.y, headingForwardRef.current.z],
      );
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
        visible={cameraMode !== "firstPerson" && vehicleMode !== "airplane"}
      />
      {vehicleMode === "airplane" ? <AirplaneModel /> : null}
      {/* Mixamo pipeline: add Idle/Fall/Land clips later and blend actions in PlayerModel with the same mixer. */}
      {/* Movement still translates/rotates this root group; skeletal animation only affects the loaded FBX. */}
    </group>
  );
});

function AirplaneModel() {
  return (
    <group name="airplane" position={[0, 0.65, 0]} scale={1.15}>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.28, 1.25, 18]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0.34]}>
        <boxGeometry args={[0.55, 0.34, 1.25]} />
        <meshStandardMaterial color="#ced4da" roughness={0.42} metalness={0.08} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.02, 0.08]}>
        <boxGeometry args={[3.4, 0.08, 0.42]} />
        <meshStandardMaterial color="#e63946" roughness={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.16, 0.9]}>
        <boxGeometry args={[1.15, 0.08, 0.3]} />
        <meshStandardMaterial color="#457b9d" roughness={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.38, 0.7]}>
        <boxGeometry args={[0.16, 0.8, 0.32]} />
        <meshStandardMaterial color="#1d3557" roughness={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.22, -0.18]}>
        <sphereGeometry args={[0.24, 16, 8]} />
        <meshStandardMaterial color="#74c0fc" roughness={0.18} metalness={0.05} />
      </mesh>
    </group>
  );
}

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

function updateAirplaneFlight(
  player: Group,
  input: PlayerInputState,
  planetRadius: number,
  delta: number,
  headingForwardRef: MutableRefObject<Vector3>,
  airplaneSpeedRef: MutableRefObject<number>,
  verticalVelocityRef: MutableRefObject<number>,
) {
  setPlanetCenter(planetCenter, planetRadius);
  setSurfaceNormal(surfaceNormal, planetCenter, player.position);
  projectDirectionToSurface(headingForwardRef.current, surfaceNormal);

  const turnInput = Number(input.left) - Number(input.right);
  if (turnInput !== 0) {
    headingForwardRef.current.applyAxisAngle(surfaceNormal, turnInput * AIRPLANE_TURN_SPEED * delta);
    projectDirectionToSurface(headingForwardRef.current, surfaceNormal);
  }

  const targetSpeed = input.backward
    ? AIRPLANE_BRAKE_SPEED
    : input.forward
      ? input.run
        ? AIRPLANE_TURBO_SPEED
        : AIRPLANE_CRUISE_SPEED
      : AIRPLANE_CRUISE_SPEED * 0.74;

  airplaneSpeedRef.current +=
    (targetSpeed - airplaneSpeedRef.current) * (1 - Math.exp(-AIRPLANE_ACCELERATION * delta));

  forwardDirection.copy(headingForwardRef.current);
  projectDirectionToSurface(forwardDirection, surfaceNormal);

  const altitude = getSurfaceAltitude(player.position, planetCenter, planetRadius);
  const targetVerticalSpeed = input.jump
    ? AIRPLANE_CLIMB_SPEED
    : input.flyDown
      ? AIRPLANE_DESCEND_SPEED
      : altitude < AIRPLANE_MIN_ALTITUDE * 1.8
        ? AIRPLANE_CLIMB_SPEED * 0.32
        : -1.8;

  verticalVelocityRef.current +=
    (targetVerticalSpeed - verticalVelocityRef.current) * (1 - Math.exp(-AIRPLANE_ACCELERATION * delta));

  const nextAltitude = Math.max(
    AIRPLANE_MIN_ALTITUDE,
    altitude + verticalVelocityRef.current * delta,
  );

  player.position.addScaledVector(forwardDirection, airplaneSpeedRef.current * delta);
  projectToPlanetRadius(player.position, planetCenter, planetRadius + nextAltitude);
  setSurfaceNormal(surfaceNormal, planetCenter, player.position);
  projectDirectionToSurface(headingForwardRef.current, surfaceNormal);

  if (nextAltitude <= AIRPLANE_MIN_ALTITUDE + 0.01 && verticalVelocityRef.current < 0) {
    verticalVelocityRef.current = 0;
  }

  return airplaneSpeedRef.current > 1;
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

function projectDirectionToSurface(direction: Vector3, normal: Vector3) {
  direction.addScaledVector(normal, -direction.dot(normal));

  if (direction.lengthSq() < 0.0001) {
    direction.crossVectors(Math.abs(normal.y) < 0.92 ? upAxis : fallbackAxis, normal);
  }

  return direction.normalize();
}

function alignPlayerToPlanetSurface(player: Group, normal: Vector3, headingForward: Vector3, delta: number) {
  forwardDirection.copy(headingForward);
  projectDirectionToSurface(forwardDirection, normal);
  rightDirection.crossVectors(normal, forwardDirection).normalize();
  correctedForward.copy(forwardDirection);
  orientationMatrix.makeBasis(rightDirection, normal, correctedForward);
  targetQuaternion.setFromRotationMatrix(orientationMatrix);
  player.quaternion.slerp(targetQuaternion, 1 - Math.exp(-TURN_SPEED * delta));
}

function getHeadingYaw(direction: Vector3) {
  return Math.atan2(direction.x, direction.z);
}
