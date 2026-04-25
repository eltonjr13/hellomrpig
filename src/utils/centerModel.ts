import { Box3, Object3D, Vector3 } from "three";

export type CenterModelOptions = {
  centerXZ?: boolean;
  standOnGround?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

export type CenterModelResult = {
  box: Box3;
  size: Vector3;
  center: Vector3;
};

export function centerModel(model: Object3D, options: CenterModelOptions = {}): CenterModelResult {
  const {
    centerXZ = true,
    standOnGround = true,
    castShadow = true,
    receiveShadow = true,
  } = options;

  model.traverse((object) => {
    if (!("isMesh" in object)) return;
    object.castShadow = castShadow;
    object.receiveShadow = receiveShadow;
  });

  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());

  if (centerXZ) {
    model.position.x -= center.x;
    model.position.z -= center.z;
  }

  if (standOnGround) {
    model.position.y -= box.min.y;
  }

  model.updateMatrixWorld(true);
  const finalBox = new Box3().setFromObject(model);

  return {
    box: finalBox,
    size: finalBox.getSize(new Vector3()),
    center: finalBox.getCenter(new Vector3()),
  };
}

export function scaleModelToHeight(model: Object3D, targetHeight: number): number {
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());

  if (!Number.isFinite(size.y) || size.y <= 0) {
    return 1;
  }

  const scaleMultiplier = targetHeight / size.y;
  model.scale.multiplyScalar(scaleMultiplier);
  model.updateMatrixWorld(true);

  return scaleMultiplier;
}
