import type { ResourceInventory } from "../resources/types";
import type { DigitalSettlement, NeonPath, Structure, StructureType } from "./types";
import { getStructureCost, getStructureImportance } from "./BuildingPlanner";
import { distance } from "../resources/ResourceManager";

const MIN_STRUCTURE_DISTANCE = 2.6;
const PASSIVE_BUILD_PROGRESS_RATIO = 0.22;

export function createStructure(type: StructureType, settlement: DigitalSettlement, index: number): Structure {
  const connectedToId = type === "core_node" ? null : findConnectionTarget(settlement, type);
  const position = getStructurePosition(type, settlement, index, connectedToId);

  return {
    id: type === "core_node" ? `${settlement.id}-core-node` : `${settlement.id}-${type}-${index}-${Date.now()}`,
    type,
    position,
    level: 1,
    health: 100,
    cost: getStructureCost(type),
    progress: 0,
    status: "planned",
    connectedToId,
    importance: getStructureImportance(type),
  };
}

export function canPayCost(storage: ResourceInventory, cost: Partial<ResourceInventory>) {
  return Object.entries(cost).every(([resource, amount]) => (storage[resource as keyof ResourceInventory] ?? 0) >= (amount ?? 0));
}

export function payCost(storage: ResourceInventory, cost: Partial<ResourceInventory>) {
  const next = { ...storage };
  for (const [resource, amount] of Object.entries(cost)) {
    const key = resource as keyof ResourceInventory;
    next[key] = Math.max(0, (next[key] ?? 0) - (amount ?? 0));
  }
  return next;
}

export function advanceConstruction(settlement: DigitalSettlement, deltaSeconds: number) {
  let changed = false;
  const structures = settlement.structures.map((structure) => {
    if (structure.status !== "building") return structure;
    changed = true;
    const progress = Math.min(100, structure.progress + deltaSeconds * getBuildSpeed(settlement, structure.type) * PASSIVE_BUILD_PROGRESS_RATIO);
    return {
      ...structure,
      progress,
      status: progress >= 100 ? "completed" as const : "building" as const,
      activeWorkers: progress >= 100 ? [] : structure.activeWorkers,
    };
  });

  if (!changed) return connectSettlementPaths(settlement);

  return connectSettlementPaths({
    ...settlement,
    structures,
    defense: structures.filter((structure) => structure.status === "completed" && structure.type === "shield_gate").length * 28,
    growthScore: settlement.growthScore + structures.filter((structure) => structure.status === "completed").length * 0.16,
  });
}

export function connectSettlementPaths(settlement: DigitalSettlement): DigitalSettlement {
  const completed = settlement.structures.filter((structure) => structure.status === "completed" && structure.type !== "neon_path");
  const paths = [...settlement.paths];

  for (const structure of completed) {
    if (structure.id === settlement.coreStructureId || !structure.connectedToId) continue;
    if (paths.some((path) => path.toStructureId === structure.id || path.fromStructureId === structure.id)) continue;

    const parent = completed.find((candidate) => candidate.id === structure.connectedToId) ?? getNearestStructure(structure, completed, settlement.coreStructureId);
    if (!parent || parent.id === structure.id) continue;

    paths.push(createNeonPath(parent, structure, settlement.neonColor));
  }

  return { ...settlement, paths };
}

export function createBuilding(type: StructureType, settlement: DigitalSettlement, index: number) {
  return createStructure(type, settlement, index);
}

function getBuildSpeed(settlement: DigitalSettlement, type: StructureType) {
  const hasLogicLab = settlement.structures.some((structure) => structure.type === "logic_lab" && structure.status === "completed");
  const hasEnergyGrid = settlement.structures.some((structure) => structure.type === "energy_tower" && structure.status === "completed");
  const typeModifier = type === "neon_path" ? 1.8 : type === "core_node" ? 0.75 : 1;
  return (hasLogicLab ? 18 : hasEnergyGrid ? 14 : 10) * typeModifier;
}

function getStructurePosition(
  type: StructureType,
  settlement: DigitalSettlement,
  index: number,
  connectedToId: string | null,
) {
  if (type === "core_node") return settlement.position;

  const parent = settlement.structures.find((structure) => structure.id === connectedToId);
  const importance = getStructureImportance(type);
  const baseRadius = type === "neon_path" ? 4.2 : 4.8 + (100 - importance) * 0.08;
  const ring = Math.floor(index / 7);
  const angleSeed = type === "shield_gate" ? 0.74 : type === "energy_tower" ? 0.18 : type === "data_farm" ? 0.46 : 0.31;
  const angle = (index * 2.399963 + angleSeed) % (Math.PI * 2);
  let candidate = {
    x: settlement.position.x + Math.cos(angle) * (baseRadius + ring * 3.2),
    y: settlement.position.y,
    z: settlement.position.z + Math.sin(angle) * (baseRadius + ring * 3.2),
  };

  if (type === "neon_path" && parent) {
    candidate = {
      x: (settlement.position.x + parent.position.x) * 0.5,
      y: settlement.position.y,
      z: (settlement.position.z + parent.position.z) * 0.5,
    };
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const overlaps = settlement.structures.some((structure) => distance(structure.position, candidate) < MIN_STRUCTURE_DISTANCE);
    if (!overlaps) return candidate;

    const nextAngle = angle + attempt * 0.72;
    const nextRadius = baseRadius + ring * 3.2 + attempt * 1.2;
    candidate = {
      x: settlement.position.x + Math.cos(nextAngle) * nextRadius,
      y: settlement.position.y,
      z: settlement.position.z + Math.sin(nextAngle) * nextRadius,
    };
  }

  return candidate;
}

function findConnectionTarget(settlement: DigitalSettlement, type: StructureType) {
  const completed = settlement.structures.filter((structure) => structure.status === "completed" && structure.type !== "neon_path");
  const structures = completed.length > 0 ? completed : settlement.structures.filter((structure) => structure.type !== "neon_path");
  const core = structures.find((structure) => structure.id === settlement.coreStructureId || structure.type === "core_node");
  if (type === "energy_tower" || type === "logic_lab" || type === "social_hub" || type === "memory_archive") return core?.id ?? null;
  if (structures.length === 0) return null;

  return structures
    .slice()
    .sort((a, b) => distance(a.position, settlement.position) - distance(b.position, settlement.position))[0]?.id ?? null;
}

function getNearestStructure(structure: Structure, candidates: Structure[], coreStructureId: string | null) {
  const core = candidates.find((candidate) => candidate.id === coreStructureId);
  if (core) return core;

  return candidates
    .filter((candidate) => candidate.id !== structure.id)
    .sort((a, b) => distance(a.position, structure.position) - distance(b.position, structure.position))[0];
}

function createNeonPath(from: Structure, to: Structure, color: string): NeonPath {
  return {
    id: `${from.id}-${to.id}-path`,
    fromStructureId: from.id,
    toStructureId: to.id,
    from: from.position,
    to: to.position,
    color,
    active: true,
  };
}
