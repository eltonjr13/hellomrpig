import { memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useGameStore } from "../store/useGameStore";

const target = new Vector3();
const desiredPosition = new Vector3();
const lookAtTarget = new Vector3();
const cameraOffset = new Vector3();

export const CameraController = memo(function CameraController() {
  const camera = useThree((state) => state.camera);

  useFrame((_, delta) => {
    const { playerPosition, cameraYaw, cameraPitch, cameraDistance } = useGameStore.getState();
    target.set(playerPosition[0], playerPosition[1], playerPosition[2]);

    cameraOffset.set(
      Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance,
      Math.sin(cameraPitch) * cameraDistance,
      Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance,
    );

    desiredPosition.copy(target).add(cameraOffset);
    camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, delta));
    lookAtTarget.copy(target).add(new Vector3(0, 1.2, 0));
    camera.lookAt(lookAtTarget);
  });

  return null;
});
