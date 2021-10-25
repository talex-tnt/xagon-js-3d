import { Nullable, AbstractMesh, Scene } from '@babylonjs/core';
export const getAssetMesh = (
  scene: Scene,
  mesh: false | Nullable<AbstractMesh> | undefined,
): Nullable<AbstractMesh> | void => {
  if (mesh) {
    const name = mesh.metadata.triangle.getName();
    const assetMesh = scene.getMeshByName(name);
    if (assetMesh) {
      return assetMesh;
    }
    // eslint-disable-next-line no-console
    console.assert(typeof assetMesh === 'object', 'Asset not found');
  }
  return undefined;
};
