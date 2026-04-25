import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { Group } from "three";

const objLoader = new OBJLoader();
const cache = new Map<string, Promise<Group>>();

export function loadObjModel(url: string) {
  if (!cache.has(url)) {
    cache.set(
      url,
      objLoader.loadAsync(url).then((model) => model.clone()),
    );
  }

  return cache.get(url)!.then((model) => model.clone());
}
