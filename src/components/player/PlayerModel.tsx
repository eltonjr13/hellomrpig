import { memo, useEffect, useMemo, useState } from "react";
import { Box3, Group } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { centerModel } from "../../utils/centerModel";
import type { Vec3Tuple } from "../../store/useGameStore";

export type PlayerModelTransform = {
  path: string;
  scale: number;
  rotation: Vec3Tuple;
  position: Vec3Tuple;
};

export const PLAYER_MODEL_TRANSFORM: PlayerModelTransform = {
  path: "/models/player/player.obj",
  scale: 1,
  rotation: [0, 0, 0],
  position: [0, 0, 0],
};

type PlayerModelProps = {
  transform?: PlayerModelTransform;
  debug?: boolean;
};

type LoadState =
  | { status: "loading"; model: null; box: null }
  | { status: "ready"; model: Group; box: Box3 }
  | { status: "error"; model: null; box: null };

const loader = new OBJLoader();

export const PlayerModel = memo(function PlayerModel({
  transform = PLAYER_MODEL_TRANSFORM,
  debug = false,
}: PlayerModelProps) {
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
    model: null,
    box: null,
  });

  useEffect(() => {
    let cancelled = false;

    setLoadState({ status: "loading", model: null, box: null });

    loader.load(
      transform.path,
      (obj) => {
        if (cancelled) return;

        const model = obj.clone(true);
        const { box } = centerModel(model, {
          centerXZ: true,
          standOnGround: true,
          castShadow: true,
          receiveShadow: true,
        });

        setLoadState({ status: "ready", model, box });
      },
      undefined,
      () => {
        if (!cancelled) setLoadState({ status: "error", model: null, box: null });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [transform.path]);

  const fallback = useMemo(() => <PlayerModelFallback isError={loadState.status === "error"} />, [loadState.status]);

  return (
    <group
      name="player-model-root"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      {loadState.status === "ready" ? (
        <>
          <primitive object={loadState.model} />
          {debug && loadState.box ? <box3Helper args={[loadState.box, "#f7d154"]} /> : null}
        </>
      ) : (
        fallback
      )}
    </group>
  );
});

function PlayerModelFallback({ isError }: { isError: boolean }) {
  return (
    <group name={isError ? "player-model-fallback-missing-obj" : "player-model-loading"}>
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.36, 1.25, 8, 16]} />
        <meshStandardMaterial color={isError ? "#f1c453" : "#e6f4ea"} roughness={0.68} wireframe={!isError} />
      </mesh>
      <mesh castShadow position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffd7b1" roughness={0.62} />
      </mesh>
    </group>
  );
}
