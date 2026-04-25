import { Sky, Stars } from "@react-three/drei";
import { memo } from "react";
import { CameraController } from "../components/CameraController";
import { Ground } from "../components/Ground";
import { NpcSystem } from "../components/NpcSystem";
import { Player } from "../components/player/Player";
import { SpawnedObjects } from "../components/SpawnedObjects";

const DEBUG_SCENE = false;

export const MainScene = memo(function MainScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[12, 20, 8]}
        intensity={2.4}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={1.2} mieCoefficient={0.004} />
      <Stars radius={180} depth={50} count={900} factor={3} fade speed={0.2} />
      <fog attach="fog" args={["#86b89a", 95, 360]} />

      {DEBUG_SCENE ? (
        <>
          <gridHelper args={[500, 50, "#9fd2a6", "#315842"]} />
          <axesHelper args={[5]} />
        </>
      ) : null}

      <Ground />
      <SpawnedObjects />
      <NpcSystem />
      <Player debug={false} />
      <CameraController />
    </>
  );
});
