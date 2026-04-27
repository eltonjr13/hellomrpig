import type { Society } from "./types";
import type { DigitalSettlement } from "../village/types";

export function getSocietyStateVector(society: Society, settlement?: DigitalSettlement) {
  return [
    society.members.length / 20,
    (settlement?.storage.energy ?? society.resources.energy) / 250,
    (settlement?.storage.data ?? society.resources.data) / 250,
    (settlement?.storage.matter ?? society.resources.matter) / 300,
    (settlement?.storage.signal ?? society.resources.signal) / 250,
    (settlement?.storage.core ?? society.resources.core) / 20,
    society.dangerLevel / 100,
    society.stability / 100,
    society.culture.cooperation / 100,
    society.culture.aggression / 100,
    society.territoryRadius / 100,
  ];
}

export function chooseSocietyActionByPolicy(society: Society, settlement?: DigitalSettlement) {
  void getSocietyStateVector(society, settlement);
  return null;
}
