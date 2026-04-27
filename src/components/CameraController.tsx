import { memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Camera, PerspectiveCamera, Vector3 } from "three";
import { useGameStore } from "../store/useGameStore";

const CAMERA_FOLLOW_TURN_SPEED = 4.5;
const FIRST_PERSON_EYE_HEIGHT = 1.62;
const FIRST_PERSON_FORWARD_OFFSET = 0.18;
const THIRD_PERSON_FOV = 60;
const FIRST_PERSON_FOV = 75;
const target = new Vector3();
const desiredPosition = new Vector3();
const lookAtTarget = new Vector3();
const cameraOffset = new Vector3();
const forward = new Vector3();
const planetCenter = new Vector3();
const surfaceNormal = new Vector3();
const tangentForward = new Vector3();

export const CameraController = memo(function CameraController() {
  const camera = useThree((state) => state.camera);

  useFrame((_, delta) => {
    const {
      playerPosition,
      playerRotationY,
      playerIsMoving,
      cameraMode,
      cameraYaw,
      cameraPitch,
      cameraDistance,
      setCameraOrbit,
      currentWorld,
    } = useGameStore.getState();

    planetCenter.set(0, -currentWorld.radius, 0);
    target.set(playerPosition[0], playerPosition[1], playerPosition[2]);
    surfaceNormal.subVectors(target, planetCenter);

    if (surfaceNormal.lengthSq() < 0.0001) {
      surfaceNormal.set(0, 1, 0);
    } else {
      surfaceNormal.normalize();
    }

    tangentForward.set(Math.sin(playerRotationY), 0, Math.cos(playerRotationY));
    tangentForward.addScaledVector(surfaceNormal, -tangentForward.dot(surfaceNormal));

    if (tangentForward.lengthSq() < 0.0001) {
      tangentForward.set(0, 0, 1);
    } else {
      tangentForward.normalize();
    }

    if (cameraMode === "firstPerson") {
      setCameraFov(camera, FIRST_PERSON_FOV);
      camera.up.copy(surfaceNormal);

      forward.copy(tangentForward);
      desiredPosition
        .copy(target)
        .addScaledVector(surfaceNormal, FIRST_PERSON_EYE_HEIGHT)
        .addScaledVector(forward, FIRST_PERSON_FORWARD_OFFSET);
      camera.position.lerp(desiredPosition, 1 - Math.pow(0.0001, delta));
      lookAtTarget.copy(desiredPosition).add(forward).addScaledVector(surfaceNormal, 0.08);
      camera.lookAt(lookAtTarget);
      return;
    }

    setCameraFov(camera, THIRD_PERSON_FOV);
    camera.up.copy(surfaceNormal);

    const nextCameraYaw = playerIsMoving
      ? lerpAngle(cameraYaw, playerRotationY + Math.PI, 1 - Math.exp(-CAMERA_FOLLOW_TURN_SPEED * delta))
      : cameraYaw;

    if (nextCameraYaw !== cameraYaw) {
      setCameraOrbit(nextCameraYaw, cameraPitch);
    }

    tangentForward.set(Math.sin(nextCameraYaw), 0, Math.cos(nextCameraYaw));
    tangentForward.addScaledVector(surfaceNormal, -tangentForward.dot(surfaceNormal));

    if (tangentForward.lengthSq() < 0.0001) {
      tangentForward.copy(forward);
    } else {
      tangentForward.normalize();
    }

    cameraOffset
      .copy(tangentForward)
      .multiplyScalar(Math.cos(cameraPitch) * cameraDistance)
      .addScaledVector(surfaceNormal, Math.sin(cameraPitch) * cameraDistance);

    desiredPosition.copy(target).add(cameraOffset);
    camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, delta));
    lookAtTarget.copy(target).addScaledVector(surfaceNormal, 1.2);
    camera.lookAt(lookAtTarget);
  });

  return null;
});

function lerpAngle(from: number, to: number, t: number) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}

function setCameraFov(camera: Camera, fov: number) {
  if (!(camera instanceof PerspectiveCamera) || camera.fov === fov) return;
  camera.fov = fov;
  camera.updateProjectionMatrix();
}
