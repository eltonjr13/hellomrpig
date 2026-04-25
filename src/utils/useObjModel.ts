import { useEffect, useState } from "react";
import type { Group } from "three";
import { loadObjModel } from "./loadModel";

export function useObjModel(modelUrl?: string) {
  const [model, setModel] = useState<Group | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!modelUrl) {
      setModel(null);
      return;
    }

    loadObjModel(modelUrl)
      .then((loadedModel) => {
        if (!cancelled) setModel(loadedModel);
      })
      .catch(() => {
        if (!cancelled) setModel(null);
      });

    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  return model;
}
