import { memo, useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import type { NeonPath } from "../../simulation/village/types";

export const NeonPathMesh = memo(function NeonPathMesh({ path }: { path: NeonPath }) {
  const transform = useMemo(() => {
    const from = new Vector3(path.from.x, path.from.y + 0.06, path.from.z);
    const to = new Vector3(path.to.x, path.to.y + 0.06, path.to.z);
    const direction = to.clone().sub(from);
    const length = Math.max(0.001, direction.length());
    const midpoint = from.clone().add(to).multiplyScalar(0.5);
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());

    return { midpoint, quaternion, length };
  }, [path.from.x, path.from.y, path.from.z, path.to.x, path.to.y, path.to.z]);

  return (
    <group position={transform.midpoint} quaternion={transform.quaternion}>
      <mesh>
        <cylinderGeometry args={[0.055, 0.055, transform.length, 8]} />
        <meshBasicMaterial color={path.color} transparent opacity={path.active ? 0.86 : 0.28} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.18, 0.18, transform.length, 8]} />
        <meshBasicMaterial color={path.color} transparent opacity={path.active ? 0.16 : 0.05} />
      </mesh>
    </group>
  );
});
