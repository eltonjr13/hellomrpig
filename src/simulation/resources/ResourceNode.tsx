import { ResourceNodeMesh } from "../../components/world/ResourceNodeMesh";
import type { ResourceNode as ResourceNodeState } from "./types";

export function ResourceNode({ node }: { node: ResourceNodeState }) {
  return <ResourceNodeMesh node={node} />;
}
