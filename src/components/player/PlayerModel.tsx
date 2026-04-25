import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AnimationAction,
  AnimationMixer,
  Box3,
  Group,
  LoopOnce,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { centerModel, scaleModelToHeight } from "../../utils/centerModel";
import { removeHorizontalRootMotion } from "../../utils/sanitizeMixamoClip";
import type { PlayerCharacterId, Vec3Tuple } from "../../store/useGameStore";

export type PlayerModelTransform = {
  path: string;
  texturePath?: string;
  danceAnimation?: "default" | "model";
  groundOffset?: number;
  scale: number;
  targetHeight: number;
  rotation: Vec3Tuple;
  position: Vec3Tuple;
};

export type PlayableCharacter = {
  id: PlayerCharacterId;
  name: string;
  transform: PlayerModelTransform;
};

export type PlayerAnimationState = "idle" | "walk" | "run" | "jump" | "fall" | "kick" | "dance";

export const PLAYER_MODEL_TRANSFORM: PlayerModelTransform = {
  path: "/models/player/Walking.fbx",
  texturePath: "/models/player/texture_pbr_20250901.png",
  scale: 1,
  targetHeight: 1.85,
  rotation: [0, 0, 0],
  position: [0, 0, 0],
};

export const PLAYABLE_CHARACTERS: PlayableCharacter[] = [
  {
    id: "main",
    name: "Morador",
    transform: PLAYER_MODEL_TRANSFORM,
  },
  {
    id: "samba",
    name: "Samba",
    transform: {
      path: "/models/characters/samba-dancing.fbx",
      texturePath: "/models/characters/samba-dancing-texture.png",
      danceAnimation: "model",
      groundOffset: 0.34,
      scale: 1,
      targetHeight: 1.85,
      rotation: [0, 0, 0],
      position: [0, 0, 0],
    },
  },
];

const PLAYER_ANIMATION_PATHS: Partial<Record<PlayerAnimationState, string>> = {
  idle: "/models/player/Idle.fbx",
  walk: "/models/player/Walking.fbx",
  run: "/models/player/Run.fbx",
  jump: "/models/player/Jump.fbx",
  kick: "/models/player/HurricaneKick.fbx",
  dance: "/models/player/HouseDance.fbx",
};

type PlayerModelProps = {
  transform?: PlayerModelTransform;
  animationState?: PlayerAnimationState;
  animationSpeed?: number;
  debug?: boolean;
  visible?: boolean;
};

type LoadState =
  | { status: "loading"; model: null; box: null }
  | {
      status: "ready";
      model: Group;
      box: Box3;
      mixer: AnimationMixer | null;
      actions: Partial<Record<PlayerAnimationState, AnimationAction>>;
    }
  | { status: "error"; model: null; box: null };

const loader = new FBXLoader();
const textureLoader = new TextureLoader();

export const PlayerModel = memo(function PlayerModel({
  transform = PLAYER_MODEL_TRANSFORM,
  animationState = "idle",
  animationSpeed = 1,
  debug = false,
  visible = true,
}: PlayerModelProps) {
  const animationRootRef = useRef<Group>(null);
  const activeActionRef = useRef<AnimationAction | null>(null);
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
    model: null,
    box: null,
  });

  useEffect(() => {
    let cancelled = false;
    let activeMixer: AnimationMixer | null = null;

    setLoadState({ status: "loading", model: null, box: null });

    async function loadPlayer() {
      try {
        const texturePromise = transform.texturePath ? textureLoader.loadAsync(transform.texturePath) : null;
        const [baseFbx, idleFbx, walkFbx, runFbx, jumpFbx, kickFbx, danceFbx, playerTexture] = await Promise.all([
          loader.loadAsync(transform.path),
          loader.loadAsync(PLAYER_ANIMATION_PATHS.idle!),
          loader.loadAsync(PLAYER_ANIMATION_PATHS.walk!),
          loader.loadAsync(PLAYER_ANIMATION_PATHS.run!),
          loader.loadAsync(PLAYER_ANIMATION_PATHS.jump!),
          loader.loadAsync(PLAYER_ANIMATION_PATHS.kick!),
          loader.loadAsync(PLAYER_ANIMATION_PATHS.dance!),
          texturePromise,
        ]);

        if (cancelled) return;

        const model = baseFbx;
        model.scale.setScalar(transform.scale);
        scaleModelToHeight(model, transform.targetHeight);
        const { box } = centerModel(model, {
          centerXZ: true,
          standOnGround: true,
          castShadow: true,
          receiveShadow: false,
        });
        if (playerTexture) {
          applyReadablePlayerMaterial(model, playerTexture);
        }

        const clips = {
          idle: idleFbx.animations[0] ? removeHorizontalRootMotion(idleFbx.animations[0]) : null,
          walk: walkFbx.animations[0] ? removeHorizontalRootMotion(walkFbx.animations[0]) : null,
          run: runFbx.animations[0] ? removeHorizontalRootMotion(runFbx.animations[0]) : null,
          jump: jumpFbx.animations[0] ? removeHorizontalRootMotion(jumpFbx.animations[0]) : null,
          kick: kickFbx.animations[0] ? removeHorizontalRootMotion(kickFbx.animations[0]) : null,
          dance:
            transform.danceAnimation === "model" && baseFbx.animations[0]
              ? removeHorizontalRootMotion(baseFbx.animations[0])
              : danceFbx.animations[0]
                ? removeHorizontalRootMotion(danceFbx.animations[0])
                : null,
        };
        const mixer = new AnimationMixer(model);
        const actions: Partial<Record<PlayerAnimationState, AnimationAction>> = {};

        for (const [name, clip] of Object.entries(clips) as Array<[PlayerAnimationState, NonNullable<(typeof clips)[keyof typeof clips]> | null]>) {
          if (!clip) continue;
          const action = mixer.clipAction(clip);
          action.enabled = true;
          action.setEffectiveWeight(1);
          actions[name] = action;
        }

        for (const oneShotAction of [actions.jump, actions.kick]) {
          oneShotAction?.setLoop(LoopOnce, 1);
          if (oneShotAction) oneShotAction.clampWhenFinished = true;
        }

        activeMixer = mixer;
        setLoadState({ status: "ready", model, box, mixer, actions });
      } catch {
        if (!cancelled) setLoadState({ status: "error", model: null, box: null });
      }
    }

    void loadPlayer();

    return () => {
      cancelled = true;
      activeActionRef.current?.stop();
      activeMixer?.stopAllAction();
      activeActionRef.current = null;
    };
  }, [transform.path, transform.scale, transform.targetHeight, transform.texturePath]);

  useFrame(({ clock }, delta) => {
    const root = animationRootRef.current;
    if (!root) return;

    const step = clock.elapsedTime * 9;
    const mixer = loadState.status === "ready" ? loadState.mixer : null;
    const actions = loadState.status === "ready" ? loadState.actions : null;

    if (mixer && actions) {
      const nextAction = getActionForState(animationState, actions);

      if (nextAction) {
        playAction(nextAction, activeActionRef, animationState === "jump" || animationState === "kick" ? 0.06 : 0.16);
        nextAction.paused = false;
        nextAction.timeScale = animationState === "run" ? animationSpeed : 1;
        mixer.update(delta);
        return;
      }

      if (activeActionRef.current?.isRunning()) {
        activeActionRef.current.paused = true;
      }
      return;
    }

    if (animationState === "walk" || animationState === "run" || animationState === "dance") {
      root.position.y = Math.abs(Math.sin(step)) * 0.07;
      root.rotation.x = Math.cos(step) * 0.025;
      root.rotation.z = Math.sin(step) * 0.045;
      return;
    }
  });

  const fallback = useMemo(
    () => (
      <PlayerModelFallback
        isError={loadState.status === "error"}
        animationState={animationState}
        animationSpeed={animationSpeed}
      />
    ),
    [animationSpeed, animationState, loadState.status],
  );

  return (
    <group
      name="player-model-root"
      position={[transform.position[0], transform.position[1] + (transform.groundOffset ?? 0), transform.position[2]]}
      rotation={transform.rotation}
      scale={transform.scale}
      visible={visible}
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

function PlayerModelFallback({
  isError,
  animationState,
  animationSpeed,
}: {
  isError: boolean;
  animationState: PlayerAnimationState;
  animationSpeed: number;
}) {
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (animationState !== "walk" && animationState !== "run" && animationState !== "dance") return;

    const step = clock.elapsedTime * 9 * animationSpeed;
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

function applyReadablePlayerMaterial(model: Group, texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;

    object.castShadow = true;
    object.receiveShadow = false;
    object.material = new MeshBasicMaterial({
      map: texture,
      color: "#ffffff",
      toneMapped: false,
    });
  });
}

function getActionForState(
  state: PlayerAnimationState,
  actions: Partial<Record<PlayerAnimationState, AnimationAction>>,
) {
  if (state === "fall") return actions.jump ?? null;
  return actions[state] ?? null;
}

function playAction(
  nextAction: AnimationAction,
  activeActionRef: React.MutableRefObject<AnimationAction | null>,
  fadeDuration: number,
) {
  const activeAction = activeActionRef.current;
  if (activeAction === nextAction) return;

  nextAction.reset().fadeIn(fadeDuration).play();
  activeAction?.fadeOut(fadeDuration);
  activeActionRef.current = nextAction;
}
