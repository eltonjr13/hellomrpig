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
      <hemisphereLight args={["#f6fbff", "#7ea889", 1.65]} />
      <ambientLight intensity={0.38} />
      <directionalLight
        castShadow
        position={[-18, 34, 22]}
        intensity={3.2}
        color="#fff2d0"
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.00008}
        shadow-normalBias={0.045}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <directionalLight position={[0, 10, 14]} intensity={1.15} color="#dceeff" />
      <directionalLight position={[18, 16, -14]} intensity={0.65} color="#fff7df" />
      <Sky sunPosition={[80, 58, 95]} turbidity={5.5} rayleigh={1.8} mieCoefficient={0.003} />
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
