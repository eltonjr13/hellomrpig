import { create } from "zustand";

export type Vec3Tuple = [number, number, number];

export type PlayerCharacterId = "main" | "samba";

export type SpawnObject = {
  id: string;
  type: "house" | "tree" | "well" | "market" | "field" | "rock" | "path" | "storage";
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
  playerPosition: Vec3Tuple;
  playerRotationY: number;
  playerIsMoving: boolean;
  selectedCharacterId: PlayerCharacterId;
  cameraYaw: number;
  cameraPitch: number;
  cameraDistance: number;
  spawnObjects: SpawnObject[];
  npcs: NpcAgent[];
  setPlayerTransform: (position: Vec3Tuple, rotationY: number, isMoving: boolean) => void;
  setSelectedCharacter: (characterId: PlayerCharacterId) => void;
  cycleSelectedCharacter: () => void;
  setCameraOrbit: (yaw: number, pitch: number) => void;
  setCameraDistance: (distance: number) => void;
  addSpawnObject: (object: SpawnObject) => void;
  updateNpcMood: (id: string, mood: NpcAgent["mood"]) => void;
  updateNpcPosition: (id: string, position: Vec3Tuple, targetPosition?: Vec3Tuple) => void;
};

const initialSpawnObjects: SpawnObject[] = [
  { id: "path-main", type: "path", position: [0, 0.01, -6], color: "#9b7653", scale: [4, 0.03, 22], collision: false },
  { id: "path-cross", type: "path", position: [0, 0.012, -8], color: "#9b7653", scale: [20, 0.03, 3.2], collision: false },
  { id: "house-1", type: "house", position: [-8, 0.8, -8], color: "#cf8f5a", scale: [3.2, 1.6, 3], rotationY: 0.2 },
  { id: "house-2", type: "house", position: [8, 0.8, -8], color: "#d9a05f", scale: [3.2, 1.6, 3], rotationY: -0.18 },
  { id: "market-1", type: "market", position: [0, 0.75, -14], color: "#4d9de0", scale: [4.6, 1.5, 2.6] },
  { id: "well-1", type: "well", position: [0, 0.45, -4], color: "#8d99ae", scale: 1.15 },
  { id: "field-1", type: "field", position: [-9, 0.05, 2], color: "#7cb342", scale: [6, 0.1, 5], collision: false },
  { id: "field-2", type: "field", position: [9, 0.05, 2], color: "#8bc34a", scale: [6, 0.1, 5], collision: false },
  { id: "storage-1", type: "storage", position: [-4.8, 0.55, -15], color: "#b96f3c", scale: [2.2, 1.1, 2.2] },
  { id: "rock-1", type: "rock", position: [6, 0.35, -1], color: "#6c757d", scale: [1.4, 0.7, 1.1] },
  { id: "tree-1", type: "tree", position: [-13, 0, -1], color: "#2d6a4f", scale: 1.4 },
  { id: "tree-2", type: "tree", position: [13, 0, -2], color: "#2f7d4f", scale: 1.25 },
  { id: "tree-3", type: "tree", position: [-12, 0, -16], color: "#2d6a4f", scale: 1.2 },
  { id: "tree-4", type: "tree", position: [12, 0, -17], color: "#2f7d4f", scale: 1.35 },
];

const initialNpcs: NpcAgent[] = [
  {
    id: "npc-farmer",
    name: "Ana",
    role: "farmer",
    position: [-8, 0, 1],
    targetPosition: [-10, 0, 4],
    mood: "moving",
    aiProfile: {
      goal: "Tend the village fields and bring food to storage.",
      memory: ["The fields need regular attention."],
    },
  },
  {
    id: "npc-builder",
    name: "Bruno",
    role: "builder",
    position: [7, 0, -10],
    targetPosition: [4, 0, -14],
    mood: "curious",
    aiProfile: {
      goal: "Inspect houses and repair village structures.",
      memory: ["The market roof was checked this morning."],
    },
  },
  {
    id: "npc-merchant",
    name: "Clara",
    role: "merchant",
    position: [1.5, 0, -13],
    targetPosition: [-2, 0, -13],
    mood: "idle",
    aiProfile: {
      goal: "Trade resources with villagers near the market.",
      memory: ["Travelers usually arrive by the main road."],
    },
  },
  {
    id: "npc-wanderer",
    name: "Davi",
    role: "wanderer",
    position: [4, 0, -2],
    targetPosition: [-4, 0, -5],
    mood: "moving",
    aiProfile: {
      goal: "Walk around the village and react to nearby activity.",
      memory: ["The well is a common meeting point."],
    },
  },
];

export const useGameStore = create<GameState>((set) => ({
  playerPosition: [0, 0, 0],
  playerRotationY: 0,
  playerIsMoving: false,
  selectedCharacterId: "main",
  cameraYaw: 0,
  cameraPitch: 0.42,
  cameraDistance: 9,
  spawnObjects: initialSpawnObjects,
  npcs: initialNpcs,
  setPlayerTransform: (playerPosition, playerRotationY, playerIsMoving) =>
    set({ playerPosition, playerRotationY, playerIsMoving }),
  setSelectedCharacter: (selectedCharacterId) => set({ selectedCharacterId }),
  cycleSelectedCharacter: () =>
    set((state) => ({
      selectedCharacterId: state.selectedCharacterId === "main" ? "samba" : "main",
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
