import { create } from "zustand";
import type { NpcAgent, Vec3Tuple } from "./useGameStore";
import type { NPC, NPCPosition } from "../npc/types";

type NPCStore = {
  npcs: NPC[];
  selectedNpcId: string | null;
  activePlanetId: string | null;
  loadPlanetNPCs: (planetId: string, baseNpcs: NpcAgent[], radius: number) => void;
  setNPCs: (npcs: NPC[]) => void;
  selectNPC: (npcId: string | null) => void;
  spawnNPC: (planetId: string, radius: number) => void;
};

export const useNPCStore = create<NPCStore>((set, get) => ({
  npcs: [],
  selectedNpcId: null,
  activePlanetId: null,
  loadPlanetNPCs: (planetId, baseNpcs, radius) => {
    if (get().activePlanetId === planetId && get().npcs.length > 0) return;

    const stored = loadStoredNPCs(planetId);
    const npcs = stored ?? baseNpcs.map((npc, index) => createNPCFromAgent(npc, planetId, radius, index));
    set({ npcs, activePlanetId: planetId, selectedNpcId: npcs[0]?.id ?? null });
  },
  setNPCs: (npcs) => {
    set({ npcs });
    const planetId = get().activePlanetId;
    if (planetId) saveStoredNPCs(planetId, npcs);
  },
  selectNPC: (selectedNpcId) => set({ selectedNpcId }),
  spawnNPC: (planetId, radius) =>
    set((state) => {
      const index = state.npcs.length;
      const agent: NpcAgent = {
        id: `${planetId}-npc-generated-${Date.now()}`,
        name: `Novo ${index + 1}`,
        role: index % 3 === 0 ? "builder" : index % 3 === 1 ? "farmer" : "wanderer",
        position: [index * 2 + 2, 0, -index * 2 - 4],
        targetPosition: [index * 2 + 5, 0, -index * 2 - 7],
        mood: "idle",
        aiProfile: {
          goal: "Encontrar um grupo social e contribuir para a vila.",
          memory: ["Chegou ao planeta procurando uma comunidade."],
        },
      };
      const npc = createNPCFromAgent(agent, planetId, radius, index);
      const npcs = [...state.npcs, npc];
      saveStoredNPCs(planetId, npcs);
      return { npcs, selectedNpcId: npc.id, activePlanetId: planetId };
    }),
}));

function createNPCFromAgent(agent: NpcAgent, planetId: string, radius: number, index: number): NPC {
  const position = toNPCPosition(projectToSphere(agent.position, radius));
  const personalitySeed = hash(`${planetId}:${agent.id}:personality`);

  return {
    id: agent.id,
    name: agent.name,
    planetId,
    role: agent.role,
    position,
    targetPosition: toNPCPosition(projectToSphere(agent.targetPosition, radius)),
    homePosition: position,
    personality: {
      openness: seeded(personalitySeed, 0, 45, 90),
      aggression: seeded(personalitySeed, 1, 8, 55),
      curiosity: seeded(personalitySeed, 2, 35, 95),
      social: seeded(personalitySeed, 3, 25, 92),
      fear: seeded(personalitySeed, 4, 8, 68),
      loyalty: seeded(personalitySeed, 5, 25, 92),
    },
    needs: {
      energy: 74 - index * 4,
      hunger: 78,
      social: 54 + index * 5,
      safety: 82,
      purpose: 60,
    },
    mood: {
      current: "neutral",
      intensity: 0.35,
    },
    memory: agent.aiProfile.memory.map((description, memoryIndex) => ({
      type: "location_event",
      targetId: planetId,
      description,
      impact: 8,
      timestamp: Date.now() - memoryIndex * 1000,
    })),
    relationships: [],
    goals: [
      {
        id: `${agent.id}-initial`,
        type: index % 2 === 0 ? "explore" : "socialize",
        priority: 50,
        status: "active",
      },
    ],
    learning: {
      preferredLocations: [],
      avoidedLocations: [],
      trustedPlayers: [],
      dangerousPlayers: [],
      behaviorWeights: {
        explore: 1,
        socialize: 1,
        rest: 1,
        avoid: 1,
        follow: 1,
      },
      actionHistory: [],
    },
    routine: [
      { hour: 0, goal: "rest", locationId: "home" },
      { hour: 7, goal: "explore", locationId: "local-area" },
      { hour: 12, goal: "socialize", locationId: "center" },
      { hour: 18, goal: "build", locationId: "work-area" },
      { hour: 22, goal: "rest", locationId: "home" },
    ],
    currentAction: "wander",
    lastDecisionAt: 0,
  };
}

function projectToSphere(position: Vec3Tuple, radius: number): Vec3Tuple {
  const centerY = -radius;
  const dx = position[0];
  const dy = position[1] - centerY;
  const dz = position[2];
  const length = Math.max(0.001, Math.sqrt(dx * dx + dy * dy + dz * dz));
  return [(dx / length) * radius, centerY + (dy / length) * radius, (dz / length) * radius];
}

function toNPCPosition(position: Vec3Tuple): NPCPosition {
  return { x: position[0], y: position[1], z: position[2] };
}

function loadStoredNPCs(planetId: string) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(planetId));
    return raw ? (JSON.parse(raw) as NPC[]) : null;
  } catch {
    return null;
  }
}

function saveStoredNPCs(planetId: string, npcs: NPC[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(planetId), JSON.stringify(npcs));
}

function getStorageKey(planetId: string) {
  return `hellomrpig:npcs:${planetId}`;
}

function seeded(seed: number, salt: number, min: number, max: number) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return min + (value - Math.floor(value)) * (max - min);
}

function hash(value: string) {
  let state = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return state >>> 0;
}
