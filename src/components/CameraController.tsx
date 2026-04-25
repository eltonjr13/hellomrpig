import { memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useGameStore } from "../store/useGameStore";

const CAMERA_FOLLOW_TURN_SPEED = 4.5;
const target = new Vector3();
const desiredPosition = new Vector3();
const lookAtTarget = new Vector3();
const cameraOffset = new Vector3();

export const CameraController = memo(function CameraController() {
  const camera = useThree((state) => state.camera);

  useFrame((_, delta) => {
    const {
      playerPosition,
      playerRotationY,
      playerIsMoving,
      cameraYaw,
      cameraPitch,
      cameraDistance,
      setCameraOrbit,
    } = useGameStore.getState();

    const nextCameraYaw = playerIsMoving
      ? lerpAngle(cameraYaw, playerRotationY + Math.PI, 1 - Math.exp(-CAMERA_FOLLOW_TURN_SPEED * delta))
      : cameraYaw;

    if (nextCameraYaw !== cameraYaw) {
      setCameraOrbit(nextCameraYaw, cameraPitch);
    }

    target.set(playerPosition[0], playerPosition[1], playerPosition[2]);

    cameraOffset.set(
      Math.sin(nextCameraYaw) * Math.cos(cameraPitch) * cameraDistance,
      Math.sin(cameraPitch) * cameraDistance,
      Math.cos(nextCameraYaw) * Math.cos(cameraPitch) * cameraDistance,
    );

    desiredPosition.copy(target).add(cameraOffset);
    camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, delta));
    lookAtTarget.copy(target).add(new Vector3(0, 1.2, 0));
    camera.lookAt(lookAtTarget);
  });

  return null;
});

function lerpAngle(from: number, to: number, t: number) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}
