import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AnimationMixer,
  AnimationClip,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { MockAiEngine } from "../ai/aiEngine";
import { useGameStore, type NpcAgent, type Vec3Tuple } from "../store/useGameStore";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { centerModel, scaleModelToHeight } from "../utils/centerModel";
import { removeHorizontalRootMotion } from "../utils/sanitizeMixamoClip";

const NPC_SPEED = 1.25;
const SAMBA_NPC_MODEL_PATH = "/models/characters/samba-dancing.fbx";
const SAMBA_NPC_TEXTURE_PATH = "/models/characters/samba-dancing-texture.png";
const NPC_WALK_ANIMATION_PATH = "/models/player/Walking.fbx";
const NPC_GROUND_OFFSET = 0.34;
const npcPosition = new Vector3();
const npcTarget = new Vector3();
const npcDirection = new Vector3();
const npcLoader = new FBXLoader();
const npcTextureLoader = new TextureLoader();

type SambaNpcAsset = {
  model: Group;
  animation: AnimationClip | null;
};

let sambaNpcAssetPromise: Promise<SambaNpcAsset> | null = null;

const patrolRoutes: Record<NpcAgent["role"], Vec3Tuple[]> = {
  farmer: [
    [-10, 0, 3],
    [-8, 0, -1],
    [-4.8, 0, -13],
    [-9, 0, 2],
  ],
  builder: [
    [8, 0, -9],
    [4.5, 0, -14],
    [-7.5, 0, -8],
    [0, 0, -4],
  ],
  merchant: [
    [-2.2, 0, -13],
    [2.2, 0, -13],
    [0, 0, -5],
    [4, 0, -8],
  ],
  wanderer: [
    [4, 0, -2],
    [-4, 0, -5],
    [6, 0, -14],
    [-7, 0, -14],
  ],
};

export const NpcSystem = memo(function NpcSystem() {
  const npcs = useGameStore((state) => state.npcs);
  const aiEngine = useMemo(() => new MockAiEngine(), []);
  const lastDecisionAtRef = useRef(0);
  const routeIndexRef = useRef<Record<string, number>>({});

  useFrame(({ clock }, delta) => {
    const state = useGameStore.getState();

    for (const npc of state.npcs) {
      npcPosition.set(npc.position[0], npc.position[1], npc.position[2]);
      npcTarget.set(npc.targetPosition[0], npc.targetPosition[1], npc.targetPosition[2]);
      npcDirection.subVectors(npcTarget, npcPosition);

      if (npcDirection.lengthSq() < 0.12) {
        const route = patrolRoutes[npc.role];
        const nextIndex = ((routeIndexRef.current[npc.id] ?? 0) + 1) % route.length;
        routeIndexRef.current[npc.id] = nextIndex;
        state.updateNpcPosition(npc.id, npc.position, route[nextIndex]);
        continue;
      }

      npcDirection.normalize();
      npcPosition.addScaledVector(npcDirection, Math.min(delta, 0.05) * NPC_SPEED);
      state.updateNpcPosition(npc.id, [npcPosition.x, 0, npcPosition.z], npc.targetPosition);
    }

    if (clock.elapsedTime - lastDecisionAtRef.current < 3) return;
    lastDecisionAtRef.current = clock.elapsedTime;

    for (const npc of state.npcs) {
      void aiEngine
        .decideNpcAction({
          npc,
          playerPosition: state.playerPosition,
          nearbyEvents: [],
        })
        .then((decision) => state.updateNpcMood(npc.id, decision.nextMood));
    }
  });

  return (
    <group name="npc-system">
      {npcs.map((npc) => (
        <group key={npc.id} position={npc.position} rotation={[0, getNpcRotationY(npc), 0]}>
          <SambaNpcModel role={npc.role} />
        </group>
      ))}
    </group>
  );
});

function SambaNpcModel({ role }: { role: NpcAgent["role"] }) {
  const modelRef = useRef<Group | null>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const [model, setModel] = useState<Group | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSambaNpcAsset()
      .then((asset) => {
        if (cancelled) return;

        const npcModel = clone(asset.model) as Group;
        tintNpcByRole(npcModel, role);
        modelRef.current = npcModel;

        if (asset.animation) {
          const mixer = new AnimationMixer(npcModel);
          const action = mixer.clipAction(asset.animation);
          action.timeScale = getNpcAnimationSpeed(role);
          action.play();
          mixerRef.current = mixer;
        }

        setModel(npcModel);
      })
      .catch(() => {
        if (!cancelled) setModel(null);
      });

    return () => {
      cancelled = true;
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      modelRef.current = null;
    };
  }, [role]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  if (!model) return <NpcFallback role={role} />;

  return (
    <group position={[0, NPC_GROUND_OFFSET, 0]}>
      <primitive object={model} />
    </group>
  );
}

function NpcFallback({ role }: { role: NpcAgent["role"] }) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.35, 1.2, 6, 12]} />
        <meshStandardMaterial color={getNpcAccentColor(role)} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#233a2d" />
      </mesh>
    </>
  );
}

function getSambaNpcAsset() {
  sambaNpcAssetPromise ??= Promise.all([
    npcLoader.loadAsync(SAMBA_NPC_MODEL_PATH),
    npcTextureLoader.loadAsync(SAMBA_NPC_TEXTURE_PATH),
    npcLoader.loadAsync(NPC_WALK_ANIMATION_PATH),
  ]).then(([model, texture, walkAnimationFbx]) => {
    model.scale.setScalar(1);
    scaleModelToHeight(model, 1.78);
    centerModel(model, {
      centerXZ: true,
      standOnGround: true,
      castShadow: true,
      receiveShadow: false,
    });
    applyNpcMaterial(model, texture);

    return {
      model,
      animation: walkAnimationFbx.animations[0] ? removeHorizontalRootMotion(walkAnimationFbx.animations[0]) : null,
    };
  });

  return sambaNpcAssetPromise;
}

function applyNpcMaterial(model: Group, texture: Texture) {
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

function tintNpcByRole(model: Object3D, role: NpcAgent["role"]) {
  const color = getNpcAccentColor(role);

  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.userData.role = role;
    object.userData.accentColor = color;
  });
}

function getNpcRotationY(npc: NpcAgent) {
  const dx = npc.targetPosition[0] - npc.position[0];
  const dz = npc.targetPosition[2] - npc.position[2];
  if (Math.abs(dx) + Math.abs(dz) < 0.001) return 0;
  return Math.atan2(dx, dz);
}

function getNpcAnimationSpeed(role: NpcAgent["role"]) {
  if (role === "merchant") return 0.72;
  if (role === "builder") return 0.9;
  if (role === "farmer") return 0.82;
  return 1;
}

function getNpcAccentColor(role: NpcAgent["role"]) {
  if (role === "farmer") return "#8fd6a6";
  if (role === "builder") return "#f7d154";
  if (role === "merchant") return "#4d9de0";
  return "#cdb4db";
}
