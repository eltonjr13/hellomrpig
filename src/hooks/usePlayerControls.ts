import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "../store/useGameStore";

export type PlayerInputState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
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
};

export function usePlayerControls() {
  const inputRef = useRef<PlayerInputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const cameraYawRef = useRef(useGameStore.getState().cameraYaw);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      cameraYawRef.current = state.cameraYaw;
    });

    const setKey = (event: KeyboardEvent, pressed: boolean) => {
      const action = keyMap[event.code];
      if (!action) return;
      inputRef.current[action] = pressed;
      event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return;
      const nextYaw = cameraYawRef.current - event.movementX * 0.003;
      useGameStore.getState().setCameraYaw(nextYaw);
    };

    const onKeyDown = (event: KeyboardEvent) => setKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => setKey(event, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return useMemo(
    () => ({
      inputRef,
      cameraYawRef,
    }),
    [],
  );
}
