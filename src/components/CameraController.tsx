import { memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useGameStore } from "../store/useGameStore";

const offset = new Vector3(0, 5, 10);
const target = new Vector3();
const desiredPosition = new Vector3();
const lookAtTarget = new Vector3();

export const CameraController = memo(function CameraController() {
  const camera = useThree((state) => state.camera);

  useFrame((_, delta) => {
    const { playerPosition, cameraYaw } = useGameStore.getState();
    target.set(playerPosition[0], playerPosition[1], playerPosition[2]);
    desiredPosition.copy(offset).applyAxisAngle(new Vector3(0, 1, 0), cameraYaw).add(target);
    camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, delta));
    lookAtTarget.copy(target).add(new Vector3(0, 1.2, 0));
    camera.lookAt(lookAtTarget);
  });

  return null;
});
