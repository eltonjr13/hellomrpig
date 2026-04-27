import { create } from "zustand";
import {
  createPlanetWorld,
  getStoredPlanetId,
  persistPlanetChoice,
  type Planet,
  type PlanetWorld,
} from "../world/PlanetManager";

export type Vec3Tuple = [number, number, number];

export type PlayerCharacterId = "main" | "samba";
export type CameraMode = "thirdPerson" | "firstPerson";
export type VehicleMode = "onFoot" | "airplane";

export type SpawnObject = {
  id: string;
  type: "house" | "tree" | "well" | "market" | "field" | "rock" | "path" | "storage";
  biome?: string;
  position: Vec3Tuple;
  color: string;
  scale: number | Vec3Tuple;
  rotationY?: number;
  collision?: boolean;
};

export type NpcAgent = {
  id: string;
  name: string;
  role: "farmer" | "builder" | "merchant" | "wanderer";
  position: Vec3Tuple;
  targetPosition: Vec3Tuple;
  mood: "idle" | "curious" | "moving";
  aiProfile: {
    goal: string;
    memory: string[];
  };
};

type GameState = {
  currentPlanet: Planet;
  currentWorld: PlanetWorld;
  worldRevision: number;
  playerPosition: Vec3Tuple;
  playerForward: Vec3Tuple;
  playerRotationY: number;
  playerIsMoving: boolean;
  selectedCharacterId: PlayerCharacterId;
  vehicleMode: VehicleMode;
  cameraMode: CameraMode;
  cameraYaw: number;
  cameraPitch: number;
  cameraDistance: number;
  spawnObjects: SpawnObject[];
  npcs: NpcAgent[];
  setCurrentPlanet: (planetId: string) => void;
  setPlayerTransform: (position: Vec3Tuple, rotationY: number, isMoving: boolean, forward?: Vec3Tuple) => void;
  setSelectedCharacter: (characterId: PlayerCharacterId) => void;
  setVehicleMode: (vehicleMode: VehicleMode) => void;
  cycleSelectedCharacter: () => void;
  toggleCameraMode: () => void;
  setCameraOrbit: (yaw: number, pitch: number) => void;
  setCameraDistance: (distance: number) => void;
  addSpawnObject: (object: SpawnObject) => void;
  updateNpcMood: (id: string, mood: NpcAgent["mood"]) => void;
  updateNpcPosition: (id: string, position: Vec3Tuple, targetPosition?: Vec3Tuple) => void;
};

const initialWorld = createPlanetWorld(getStoredPlanetId());

export const useGameStore = create<GameState>((set) => ({
  currentPlanet: initialWorld.planet,
  currentWorld: initialWorld,
  worldRevision: 0,
  playerPosition: initialWorld.spawnPoint,
  playerForward: [0, 0, -1],
  playerRotationY: initialWorld.spawnRotationY,
  playerIsMoving: false,
  selectedCharacterId: "main",
  vehicleMode: "onFoot",
  cameraMode: "thirdPerson",
  cameraYaw: initialWorld.spawnRotationY + Math.PI,
  cameraPitch: 0.42,
  cameraDistance: 9,
  spawnObjects: initialWorld.spawnObjects,
  npcs: initialWorld.npcs,
  setCurrentPlanet: (planetId) =>
    set((state) => {
      if (state.currentPlanet.id === planetId) return state;

      const currentWorld = createPlanetWorld(planetId);
      persistPlanetChoice(currentWorld.planet.id);

      return {
        currentPlanet: currentWorld.planet,
        currentWorld,
        worldRevision: state.worldRevision + 1,
        playerPosition: currentWorld.spawnPoint,
        playerForward: [0, 0, -1],
        playerRotationY: currentWorld.spawnRotationY,
        playerIsMoving: false,
        vehicleMode: "onFoot",
        cameraMode: "thirdPerson",
        cameraYaw: currentWorld.spawnRotationY + Math.PI,
        cameraPitch: 0.42,
        cameraDistance: 9,
        spawnObjects: currentWorld.spawnObjects,
        npcs: currentWorld.npcs,
      };
    }),
  setPlayerTransform: (playerPosition, playerRotationY, playerIsMoving, playerForward) =>
    set({
      playerPosition,
      playerRotationY,
      playerIsMoving,
      ...(playerForward ? { playerForward } : {}),
    }),
  setSelectedCharacter: (selectedCharacterId) => set({ selectedCharacterId }),
  setVehicleMode: (vehicleMode) => set({ vehicleMode }),
  cycleSelectedCharacter: () =>
    set((state) => ({
      selectedCharacterId: state.selectedCharacterId === "main" ? "samba" : "main",
    })),
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode: state.cameraMode === "thirdPerson" ? "firstPerson" : "thirdPerson",
    })),
  setCameraOrbit: (cameraYaw, cameraPitch) => set({ cameraYaw, cameraPitch }),
  setCameraDistance: (cameraDistance) => set({ cameraDistance }),
  addSpawnObject: (object) =>
    set((state) => ({
      spawnObjects: [...state.spawnObjects, object],
    })),
  updateNpcMood: (id, mood) =>
    set((state) => ({
      npcs: state.npcs.map((npc) => (npc.id === id ? { ...npc, mood } : npc)),
    })),
  updateNpcPosition: (id, position, targetPosition) =>
    set((state) => ({
      npcs: state.npcs.map((npc) =>
        npc.id === id ? { ...npc, position, targetPosition: targetPosition ?? npc.targetPosition } : npc,
      ),
    })),
}));
