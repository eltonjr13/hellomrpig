import { create } from "zustand";

export type Vec3Tuple = [number, number, number];

export type SpawnObject = {
  id: string;
  type: "crate" | "marker" | "resource";
  position: Vec3Tuple;
  color: string;
  scale: number;
};

export type NpcAgent = {
  id: string;
  name: string;
  position: Vec3Tuple;
  mood: "idle" | "curious" | "moving";
  aiProfile: {
    goal: string;
    memory: string[];
  };
};

type GameState = {
  playerPosition: Vec3Tuple;
  playerRotationY: number;
  cameraYaw: number;
  cameraPitch: number;
  cameraDistance: number;
  spawnObjects: SpawnObject[];
  npcs: NpcAgent[];
  setPlayerTransform: (position: Vec3Tuple, rotationY: number) => void;
  setCameraOrbit: (yaw: number, pitch: number) => void;
  setCameraDistance: (distance: number) => void;
  addSpawnObject: (object: SpawnObject) => void;
  updateNpcMood: (id: string, mood: NpcAgent["mood"]) => void;
};

const initialSpawnObjects: SpawnObject[] = [
  { id: "crate-1", type: "crate", position: [4, 0.5, -4], color: "#b96f3c", scale: 1 },
  { id: "marker-1", type: "marker", position: [-5, 0.2, -7], color: "#f1c453", scale: 1.2 },
  { id: "resource-1", type: "resource", position: [8, 0.4, 5], color: "#6ab7ff", scale: 0.8 },
];

const initialNpcs: NpcAgent[] = [
  {
    id: "npc-guide",
    name: "Guide",
    position: [-3, 0.9, 4],
    mood: "curious",
    aiProfile: {
      goal: "Introduce new players to world events.",
      memory: ["The player spawned near the central field."],
    },
  },
];

export const useGameStore = create<GameState>((set) => ({
  playerPosition: [0, 0, 0],
  playerRotationY: 0,
  cameraYaw: 0,
  cameraPitch: 0.42,
  cameraDistance: 9,
  spawnObjects: initialSpawnObjects,
  npcs: initialNpcs,
  setPlayerTransform: (playerPosition, playerRotationY) => set({ playerPosition, playerRotationY }),
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
}));
