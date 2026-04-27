import { memo } from "react";
import type { Building } from "../../simulation/village/types";

export const BuildingMesh = memo(function BuildingMesh({ building }: { building: Building }) {
  const color = building.status === "completed" ? getBuildingColor(building.type) : "#adb5bd";
  const height = building.status === "completed" ? 1 : Math.max(0.15, building.progress / 100);

  return (
    <group position={[building.position.x, building.position.y, building.position.z]}>
      <mesh castShadow receiveShadow position={[0, height * 0.42, 0]}>
        <boxGeometry args={[1.4, height, 1.4]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      {building.type === "watchtower" ? (
        <mesh castShadow position={[0, 1.25, 0]}>
          <boxGeometry args={[0.9, 0.32, 0.9]} />
          <meshStandardMaterial color="#7f5539" />
        </mesh>
      ) : null}
      {building.status !== "completed" ? (
        <mesh position={[0, 1.05, 0]}>
          <ringGeometry args={[0.62, 0.68, 20]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>
      ) : null}
    </group>
  );
});

function getBuildingColor(type: Building["type"]) {
  if (type === "farm") return "#80b918";
  if (type === "well") return "#4dabf7";
  if (type === "storage") return "#b08968";
  if (type === "workshop") return "#8338ec";
  if (type === "watchtower" || type === "wall") return "#6c757d";
  if (type === "firepit") return "#fb5607";
  return "#d9a05f";
}
