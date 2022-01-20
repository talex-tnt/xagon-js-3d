import { Nullable, AbstractMesh, Scene } from '@babylonjs/core';
export const getAssetMesh = ({
  scene,
  triangleMesh,
}: {
  scene: Scene;
  triangleMesh: Nullable<AbstractMesh>;
}): Nullable<AbstractMesh> => {
  if (triangleMesh && triangleMesh.metadata && triangleMesh.metadata.triangle) {
    const name = triangleMesh.metadata.triangle.getName();
    const assetMesh = scene.getMeshByName(name);
    if (assetMesh) {
      return assetMesh;
    }
    // eslint-disable-next-line no-console
    console.assert(typeof assetMesh === 'object', 'Asset not found');
  }
  return null;
};
