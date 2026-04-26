import { Sky, Stars } from "@react-three/drei";
import { memo } from "react";
import { CameraController } from "../components/CameraController";
import { Ground } from "../components/Ground";
import { NpcSystem } from "../components/NpcSystem";
import { Player } from "../components/player/Player";
import { SpawnedObjects } from "../components/SpawnedObjects";
import { useGameStore } from "../store/useGameStore";

const DEBUG_SCENE = false;

export const MainScene = memo(function MainScene() {
  const currentWorld = useGameStore((state) => state.currentWorld);
  const worldRevision = useGameStore((state) => state.worldRevision);
  const { environment, planet } = currentWorld;

  return (
    <>
      <color attach="background" args={[environment.skyColor]} />
      <ambientLight intensity={environment.ambientIntensity} />
      <directionalLight
        castShadow
        position={[12, 20, 8]}
        intensity={environment.sunIntensity}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={1.2} mieCoefficient={0.004} />
      <Stars radius={180} depth={50} count={environment.starCount} factor={3} fade speed={0.2} />
      <fog attach="fog" args={[environment.fogColor, environment.fogNear, environment.fogFar]} />

      {DEBUG_SCENE ? (
        <>
          <gridHelper args={[500, 50, "#9fd2a6", "#315842"]} />
          <axesHelper args={[5]} />
        </>
      ) : null}

      <Ground color={environment.groundColor} />
      <group key={`${currentWorld.instanceKey}:${worldRevision}`} name={`planet-${planet.id}`}>
        {planet.type === "organic" ? <OrganicPlanetElements /> : null}
        {planet.type === "social" ? <SocialPlanetElements /> : null}
        <SpawnedObjects />
        <NpcSystem />
        <Player debug={false} />
      </group>
      <CameraController />
    </>
  );
});

function OrganicPlanetElements() {
  return (
    <group name="organic-planet-elements">
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[index * 4 - 4, 0.08, 8.5 + index * 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2 + index * 0.45, 1.32 + index * 0.45, 48]} />
          <meshStandardMaterial color={index % 2 === 0 ? "#95d5b2" : "#52b788"} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function SocialPlanetElements() {
  return (
    <group name="social-planet-elements">
      {[-5, 0, 5].map((x) => (
        <mesh key={x} castShadow position={[x, 1.25, -4]}>
          <sphereGeometry args={[0.28, 18, 12]} />
          <meshStandardMaterial color={x === 0 ? "#ffbe0b" : "#3a86ff"} emissive={x === 0 ? "#6b4f00" : "#102b59"} />
        </mesh>
      ))}
    </group>
  );
}
