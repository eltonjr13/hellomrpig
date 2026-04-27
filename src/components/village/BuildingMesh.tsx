import { memo } from "react";
import type { Structure } from "../../simulation/village/types";
import { structureColors, tronTheme } from "../../theme/tronTheme";
import { CoreNodeMesh } from "./CoreNodeMesh";
import { DataFarmMesh } from "./DataFarmMesh";
import { EnergyTowerMesh } from "./EnergyTowerMesh";
import { HologramBuildPreview } from "./HologramBuildPreview";
import { LogicLabMesh } from "./LogicLabMesh";
import { ShieldGateMesh } from "./ShieldGateMesh";
import { SocialHubMesh } from "./SocialHubMesh";

type BuildingMeshProps = {
  building: Structure;
  color?: string;
  energyRatio?: number;
};

export const BuildingMesh = memo(function BuildingMesh({ building, color, energyRatio = 0.5 }: BuildingMeshProps) {
  const accent = color ?? structureColors[building.type];

  if (building.status !== "completed") return <HologramBuildPreview structure={building} color={accent} />;
  if (building.type === "core_node") return <CoreNodeMesh structure={building} color={accent} energyRatio={energyRatio} />;
  if (building.type === "energy_tower") return <EnergyTowerMesh structure={building} color={accent} />;
  if (building.type === "data_farm") return <DataFarmMesh structure={building} color={accent} />;
  if (building.type === "logic_lab") return <LogicLabMesh structure={building} color={accent} />;
  if (building.type === "social_hub") return <SocialHubMesh structure={building} color={accent} />;
  if (building.type === "shield_gate") return <ShieldGateMesh structure={building} color={accent} />;
  if (building.type === "habitation_pod") return <HabitationPodMesh structure={building} color={accent} />;
  if (building.type === "memory_archive") return <MemoryArchiveMesh structure={building} color={accent} />;
  return <NeonRelayMesh structure={building} color={accent} />;
});

function HabitationPodMesh({ structure, color }: { structure: Structure; color: string }) {
  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh castShadow receiveShadow position={[0, 0.38, 0]}>
        <capsuleGeometry args={[0.42, 0.72, 4, 12]} />
        <meshStandardMaterial color={tronTheme.glass} emissive={color} emissiveIntensity={0.75} metalness={0.38} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.68, 0.76, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.68} />
      </mesh>
    </group>
  );
}

function MemoryArchiveMesh({ structure, color }: { structure: Structure; color: string }) {
  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh castShadow receiveShadow position={[0, 0.62, 0]}>
        <boxGeometry args={[1.22, 1.24, 1.22]} />
        <meshStandardMaterial color={tronTheme.panel} emissive={color} emissiveIntensity={1.05} metalness={0.46} roughness={0.18} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} roughness={0.16} />
      </mesh>
    </group>
  );
}

function NeonRelayMesh({ structure, color }: { structure: Structure; color: string }) {
  return (
    <group position={[structure.position.x, structure.position.y, structure.position.z]}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.36, 6]} />
        <meshStandardMaterial color={tronTheme.glass} emissive={color} emissiveIntensity={1.4} metalness={0.42} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.74} />
      </mesh>
    </group>
  );
}
