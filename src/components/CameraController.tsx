import { memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Camera, PerspectiveCamera, Vector3 } from "three";
import { useGameStore } from "../store/useGameStore";

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
      playerForward,
      cameraMode,
      cameraPitch,
      cameraDistance,
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

    tangentForward.set(playerForward[0], playerForward[1], playerForward[2]);
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

    tangentForward.set(playerForward[0], playerForward[1], playerForward[2]);
    tangentForward.addScaledVector(surfaceNormal, -tangentForward.dot(surfaceNormal));

    if (tangentForward.lengthSq() < 0.0001) {
      tangentForward.copy(forward);
    } else {
      tangentForward.normalize();
    }

    cameraOffset
      .copy(tangentForward)
      .multiplyScalar(-Math.cos(cameraPitch) * cameraDistance)
      .addScaledVector(surfaceNormal, Math.sin(cameraPitch) * cameraDistance);

    desiredPosition.copy(target).add(cameraOffset);
    camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, delta));
    lookAtTarget.copy(target).addScaledVector(surfaceNormal, 1.2);
    camera.lookAt(lookAtTarget);
  });

  return null;
});

function setCameraFov(camera: Camera, fov: number) {
  if (!(camera instanceof PerspectiveCamera) || camera.fov === fov) return;
  camera.fov = fov;
  camera.updateProjectionMatrix();
}
