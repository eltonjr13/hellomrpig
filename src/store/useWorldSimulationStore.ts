import { create } from "zustand";
import type { NPC } from "../npc/types";
import { NPCJobSystem } from "../simulation/npc/NPCJobSystem";
import { RoleSystem } from "../simulation/npc/RoleSystem";
import { MineableNodeManager } from "../simulation/mining/MineableNodeManager";
import { DestructionSystem } from "../simulation/mining/DestructionSystem";
import type { MineableNode } from "../simulation/mining/types";
import { normalizeInventory } from "../simulation/resources/types";
import { SocietyManager } from "../simulation/society/SocietyManager";
import type { Society } from "../simulation/society/types";
import { DigitalSettlementManager } from "../simulation/village/VillageManager";
import type { DigitalSettlement } from "../simulation/village/types";

type WorldSimulationState = {
  planetId: string | null;
  resources: MineableNode[];
  societies: Society[];
  villages: DigitalSettlement[];
  speedMultiplier: number;
  lastSavedAt: number;
  initialize: (planetId: string, radius: number) => void;
  tick: (input: { planetId: string; radius: number; npcs: NPC[]; setNPCs: (npcs: NPC[]) => void }) => void;
  setSpeedMultiplier: (speedMultiplier: number) => void;
  spawnResources: (planetId: string, radius: number) => void;
  resetSimulation: (planetId: string, radius: number) => void;
};

const resourceManager = new MineableNodeManager();
const destructionSystem = new DestructionSystem();
const societyManager = new SocietyManager();
const settlementManager = new DigitalSettlementManager();
const roleSystem = new RoleSystem();
const npcJobSystem = new NPCJobSystem();

export const useWorldSimulationStore = create<WorldSimulationState>((set, get) => ({
  planetId: null,
  resources: [],
  societies: [],
  villages: [],
  speedMultiplier: 1,
  lastSavedAt: 0,
  initialize: (planetId, radius) => {
    if (get().planetId === planetId && get().resources.length > 0) return;

    const stored = loadStoredSimulation(planetId);
    if (stored) {
      set({ ...stored, planetId });
      return;
    }

    set({
      planetId,
      resources: resourceManager.createInitialNodes(planetId, radius),
      societies: [],
      villages: [],
      lastSavedAt: Date.now(),
    });
  },
  tick: ({ planetId, radius, npcs, setNPCs }) => {
    const state = get();
    if (state.planetId !== planetId) {
      state.initialize(planetId, radius);
      return;
    }

    const delta = state.speedMultiplier;
    let resources = resourceManager.update(state.resources, delta);
    
    // Processar nós destruídos ou vazios
    resources = destructionSystem.processDestruction(resources);

    let societies = societyManager.update(planetId, npcs, state.societies, Date.now());
    let villages = settlementManager.update(planetId, societies, state.villages, resources, delta);
    societies = attachSettlementData(societies, villages);
    let nextNpcs = roleSystem.assignRoles(npcs, societies, villages);
    const jobResult = npcJobSystem.execute(nextNpcs, resources, societies, villages, radius);

    nextNpcs = jobResult.npcs;
    resources = jobResult.resources;
    
    // Processar nós destruídos novamente após a ação dos NPCs
    resources = destructionSystem.processDestruction(resources);

    societies = jobResult.societies;
    villages = settlementManager.update(planetId, societies, jobResult.villages, resources, delta);
    societies = attachSettlementData(societies, villages);

    set({ resources, societies, villages });
    setNPCs(nextNpcs);

    if (Date.now() - state.lastSavedAt > 5000) {
      saveStoredSimulation(planetId, { resources, societies, villages, speedMultiplier: state.speedMultiplier, lastSavedAt: Date.now() });
      set({ lastSavedAt: Date.now() });
    }
  },
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
  spawnResources: (planetId, radius) =>
    set((state) => ({
      resources: [...state.resources, ...resourceManager.createInitialNodes(`${planetId}-extra-${Date.now()}`, radius, 18)],
    })),
  resetSimulation: (planetId, radius) => {
    clearStoredSimulation(planetId);
    set({
      planetId,
      resources: resourceManager.createInitialNodes(planetId, radius),
      societies: [],
      villages: [],
      speedMultiplier: 1,
      lastSavedAt: Date.now(),
    });
  },
}));

function loadStoredSimulation(planetId: string) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(planetId));
    return raw
      ? (JSON.parse(raw) as Pick<WorldSimulationState, "resources" | "societies" | "villages" | "speedMultiplier" | "lastSavedAt">)
      : null;
  } catch {
    return null;
  }
}

function saveStoredSimulation(
  planetId: string,
  state: Pick<WorldSimulationState, "resources" | "societies" | "villages" | "speedMultiplier" | "lastSavedAt">,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(planetId), JSON.stringify(state));
}

function clearStoredSimulation(planetId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(planetId));
}

function getStorageKey(planetId: string) {
  return `hellomrpig:world-simulation:v2:${planetId}`;
}

function attachSettlementData(societies: Society[], settlements: DigitalSettlement[]) {
  return societies.map((society) => {
    const settlement = settlements.find((candidate) => candidate.societyId === society.id);
    return {
      ...society,
      resources: normalizeInventory(society.resources),
      coreNodeId: settlement?.coreStructureId ?? society.coreNodeId,
      neonColor: settlement?.neonColor ?? society.neonColor,
      techLevel: Math.max(society.techLevel, settlement?.techLevel ?? 1),
    };
  });
}
