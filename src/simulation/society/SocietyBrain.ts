import type { Society } from "./types";
import type { Village } from "../village/types";

export function getSocietyStateVector(society: Society, village?: Village) {
  return [
    society.members.length / 20,
    (village?.storage.food ?? society.resources.food) / 200,
    (village?.storage.water ?? society.resources.water) / 200,
    society.resources.wood / 250,
    society.resources.stone / 250,
    society.dangerLevel / 100,
    society.stability / 100,
    society.culture.cooperation / 100,
    society.culture.aggression / 100,
    society.territoryRadius / 100,
  ];
}

export function chooseSocietyActionByPolicy(society: Society, village?: Village) {
  void getSocietyStateVector(society, village);
  return null;
}
