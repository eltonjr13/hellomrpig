import type { NPCPosition } from "../../npc/types";
import type { ResourceInventory } from "../resources/types";

export type DigitalSociety = {
  id: string;
  name: string;
  planetId: string;
  members: string[];
  leaderId: string | null;
  territoryCenter: NPCPosition;
  territoryRadius: number;
  resources: ResourceInventory;
  culture: {
    cooperation: number;
    aggression: number;
    innovation: number;
    tradition: number;
    expansion: number;
  };
  stability: number;
  wealth: number;
  dangerLevel: number;
  neonColor: string;
  techLevel: number;
  signalReach: number;
  coreNodeId: string | null;
  collectiveMemory: string[];
  createdAt: number;
};

export type Society = DigitalSociety;
