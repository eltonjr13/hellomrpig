import { AnimationClip } from "three";

const ROOT_MOTION_TRACK_PATTERN = /(^|[._:/-])(hips|root|armature|mixamorig:Hips|mixamorigHips)\.position$/i;

export function removeHorizontalRootMotion(clip: AnimationClip): AnimationClip {
  const cleanClip = clip.clone();

  for (const track of cleanClip.tracks) {
    if (!ROOT_MOTION_TRACK_PATTERN.test(track.name)) continue;

    const values = track.values;
    const baseX = values[0] ?? 0;
    const baseZ = values[2] ?? 0;

    for (let index = 0; index < values.length; index += 3) {
      values[index] = baseX;
      values[index + 2] = baseZ;
    }
  }

  return cleanClip;
}
