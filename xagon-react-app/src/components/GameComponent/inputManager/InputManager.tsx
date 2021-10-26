import {
  Vector3,
  Scene,
  PointerEventTypes,
  TransformNode,
  ArcRotateCamera,
  AbstractMesh,
} from '@babylonjs/core';

import Triangle from 'models/Triangle';

import { getAssetMesh } from 'utils/scene';
import setupInput from './setupInput';

const TRIANGLE_SCALE = 0.85;

class InputManager {
  //
  private scene: Scene;

  public constructor(
    scene: Scene,
    camera: ArcRotateCamera,
    triangles: Triangle[],
  ) {
    this.scene = scene;
    setupInput(scene, camera, triangles);
  }

  public onMeshLoaded(triangleMesh: AbstractMesh, scalingRatio: number) {
    const inverseScaling = 1 / (scalingRatio * TRIANGLE_SCALE);
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          {
            const mesh =
              pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
            if (mesh) {
              const assetMesh = getAssetMesh(this.scene, mesh);
              const { triangle } = mesh.metadata;
              if (assetMesh && assetMesh.skeleton) {
                const flipNode = new TransformNode(
                  `flipNode${triangle.getId()}`,
                );
                flipNode.parent = assetMesh.parent;
                assetMesh.parent = flipNode;

                const objSpaceVertices = assetMesh.skeleton.bones.map((bone) =>
                  bone.getDirection(triangleMesh.up).scale(scalingRatio),
                );

                const edges = objSpaceVertices.map((v, i) =>
                  v.subtract(objSpaceVertices[(i + 1) % 3]),
                );

                flipNode.position = Vector3.Center(
                  objSpaceVertices[1],
                  objSpaceVertices[2],
                ).scale(inverseScaling);
                assetMesh.position = Vector3.Center(
                  objSpaceVertices[1],
                  objSpaceVertices[2],
                ).scale(-inverseScaling);

                this.scene.registerBeforeRender(() => {
                  flipNode.rotate(edges[1], Math.PI * 0.01);
                });
              }
            }
          }
          break;
        default:
          break;
      }
    });
  }
}

export default InputManager;
