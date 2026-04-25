import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "../store/useGameStore";

const CAMERA_ZOOM_SENSITIVITY = 0.006;
const MIN_CAMERA_DISTANCE = 3.5;
const MAX_CAMERA_DISTANCE = 18;

export type PlayerInputState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
  actionOne: boolean;
  actionTwo: boolean;
  switchCharacter: boolean;
  toggleCamera: boolean;
};

const keyMap: Record<string, keyof PlayerInputState> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
  ShiftLeft: "run",
  ShiftRight: "run",
  Digit1: "actionOne",
  Numpad1: "actionOne",
  Digit2: "actionTwo",
  Numpad2: "actionTwo",
  KeyC: "switchCharacter",
  KeyV: "toggleCamera",
};

export function usePlayerControls() {
  const inputRef = useRef<PlayerInputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    run: false,
    actionOne: false,
    actionTwo: false,
    switchCharacter: false,
    toggleCamera: false,
  });

  const cameraYawRef = useRef(useGameStore.getState().cameraYaw);
  const cameraDistanceRef = useRef(useGameStore.getState().cameraDistance);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      cameraYawRef.current = state.cameraYaw;
      cameraDistanceRef.current = state.cameraDistance;
    });

    const setKey = (event: KeyboardEvent, pressed: boolean) => {
      const action = keyMap[event.code];
      if (!action) return;
      inputRef.current[action] = pressed;
      event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      const nextDistance = clamp(
        cameraDistanceRef.current + event.deltaY * CAMERA_ZOOM_SENSITIVITY,
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE,
      );
      useGameStore.getState().setCameraDistance(nextDistance);
    };

    const onKeyDown = (event: KeyboardEvent) => setKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => setKey(event, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return useMemo(
    () => ({
      inputRef,
      cameraYawRef,
      cameraDistanceRef,
    }),
    [],
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
