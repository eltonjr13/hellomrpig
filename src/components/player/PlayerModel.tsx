import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { AnimationAction, AnimationMixer, Box3, Group, Mesh } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { centerModel, scaleModelToHeight } from "../../utils/centerModel";
import { removeHorizontalRootMotion } from "../../utils/sanitizeMixamoClip";
import type { Vec3Tuple } from "../../store/useGameStore";

export type PlayerModelTransform = {
  path: string;
  scale: number;
  targetHeight: number;
  rotation: Vec3Tuple;
  position: Vec3Tuple;
};

export const PLAYER_MODEL_TRANSFORM: PlayerModelTransform = {
  path: "/models/player/Walking.fbx",
  scale: 1,
  targetHeight: 1.85,
  rotation: [0, 0, 0],
  position: [0, 0, 0],
};

type PlayerModelProps = {
  transform?: PlayerModelTransform;
  isWalking?: boolean;
  debug?: boolean;
};

type LoadState =
  | { status: "loading"; model: null; box: null }
  | { status: "ready"; model: Group; box: Box3; mixer: AnimationMixer | null; walkAction: AnimationAction | null }
  | { status: "error"; model: null; box: null };

const loader = new FBXLoader();

export const PlayerModel = memo(function PlayerModel({
  transform = PLAYER_MODEL_TRANSFORM,
  isWalking = false,
  debug = false,
}: PlayerModelProps) {
  const animationRootRef = useRef<Group>(null);
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
    model: null,
    box: null,
  });

  useEffect(() => {
    let cancelled = false;
    let activeMixer: AnimationMixer | null = null;
    let activeAction: AnimationAction | null = null;

    setLoadState({ status: "loading", model: null, box: null });

    loader.load(
      transform.path,
      (fbx) => {
        if (cancelled) return;

        const model = fbx;
        model.scale.setScalar(transform.scale);
        scaleModelToHeight(model, transform.targetHeight);
        const { box } = centerModel(model, {
          centerXZ: true,
          standOnGround: true,
          castShadow: true,
          receiveShadow: true,
        });

        const walkClip = fbx.animations[0] ? removeHorizontalRootMotion(fbx.animations[0]) : null;
        const mixer = walkClip ? new AnimationMixer(model) : null;
        const walkAction = mixer && walkClip ? mixer.clipAction(walkClip) : null;

        if (walkAction) {
          walkAction.enabled = true;
          walkAction.setEffectiveWeight(1);
        }

        activeMixer = mixer;
        activeAction = walkAction;
        setLoadState({ status: "ready", model, box, mixer, walkAction });
      },
      undefined,
      () => {
        if (!cancelled) setLoadState({ status: "error", model: null, box: null });
      },
    );

    return () => {
      cancelled = true;
      activeAction?.stop();
      activeMixer?.stopAllAction();
    };
  }, [transform.path, transform.scale, transform.targetHeight]);

  useFrame(({ clock }, delta) => {
    const root = animationRootRef.current;
    if (!root) return;

    const step = clock.elapsedTime * 9;
    const mixer = loadState.status === "ready" ? loadState.mixer : null;
    const walkAction = loadState.status === "ready" ? loadState.walkAction : null;

    if (mixer && walkAction) {
      if (isWalking) {
        walkAction.paused = false;
        if (!walkAction.isRunning()) {
          walkAction.play();
        }

        mixer.update(delta);
        return;
      }

      if (walkAction.isRunning()) {
        walkAction.paused = true;
      }
      return;
    }

    if (isWalking) {
      root.position.y = Math.abs(Math.sin(step)) * 0.07;
      root.rotation.x = Math.cos(step) * 0.025;
      root.rotation.z = Math.sin(step) * 0.045;
      return;
    }
  });

  const fallback = useMemo(
    () => <PlayerModelFallback isError={loadState.status === "error"} isWalking={isWalking} />,
    [isWalking, loadState.status],
  );

  return (
    <group
      name="player-model-root"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <group ref={animationRootRef} name="player-animation-root">
        {loadState.status === "ready" ? (
          <>
            <primitive object={loadState.model} />
            {debug && loadState.box ? <box3Helper args={[loadState.box, "#f7d154"]} /> : null}
          </>
        ) : (
          fallback
        )}
      </group>
    </group>
  );
});

function PlayerModelFallback({ isError, isWalking }: { isError: boolean; isWalking: boolean }) {
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (!isWalking) return;

    const step = clock.elapsedTime * 9;
    const smoothing = 1 - Math.pow(0.001, delta);
    const stride = Math.sin(step) * 0.75;

    const limbs = [
      [leftArmRef.current, stride],
      [rightArmRef.current, -stride],
      [leftLegRef.current, -stride],
      [rightLegRef.current, stride],
    ] as const;

    for (const [limb, targetRotation] of limbs) {
      if (!limb) continue;
      limb.rotation.x += (targetRotation - limb.rotation.x) * smoothing;
    }
  });

  return (
    <group name={isError ? "player-model-fallback-missing-obj" : "player-model-loading"}>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.52, 1.0, 0.28]} />
        <meshStandardMaterial color={isError ? "#f1c453" : "#e6f4ea"} roughness={0.68} wireframe={!isError} />
      </mesh>
      <mesh castShadow position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffd7b1" roughness={0.62} />
      </mesh>
      <mesh ref={leftArmRef} castShadow receiveShadow position={[-0.43, 1.17, 0]}>
        <boxGeometry args={[0.16, 0.75, 0.16]} />
        <meshStandardMaterial color="#d8eadf" roughness={0.7} />
      </mesh>
      <mesh ref={rightArmRef} castShadow receiveShadow position={[0.43, 1.17, 0]}>
        <boxGeometry args={[0.16, 0.75, 0.16]} />
        <meshStandardMaterial color="#d8eadf" roughness={0.7} />
      </mesh>
      <mesh ref={leftLegRef} castShadow receiveShadow position={[-0.16, 0.34, 0]}>
        <boxGeometry args={[0.18, 0.68, 0.18]} />
        <meshStandardMaterial color="#5c7fbd" roughness={0.7} />
      </mesh>
      <mesh ref={rightLegRef} castShadow receiveShadow position={[0.16, 0.34, 0]}>
        <boxGeometry args={[0.18, 0.68, 0.18]} />
        <meshStandardMaterial color="#5c7fbd" roughness={0.7} />
      </mesh>
    </group>
  );
}
