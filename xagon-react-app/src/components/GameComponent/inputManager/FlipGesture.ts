import {
  AbstractMesh,
  PointerInfo,
  Scene,
  TransformNode,
  Nullable,
  Node,
} from '@babylonjs/core';
import { getAssetMesh } from 'utils/scene';

import { k_triangleScale } from 'constants/index';
import Triangle from 'models/Triangle';
import Gesture from './Gesture';

interface GestureContext {
  scene: Scene;
  triangleMesh: AbstractMesh;
  scalingRatio: number;
}

class FlipGesture extends Gesture {
  private context: GestureContext;

  private firstTriangle: Nullable<AbstractMesh>;

  private secondTriangle: Nullable<AbstractMesh>;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangle = null;
    this.secondTriangle = null;
  }

  public extractMesh(mesh: AbstractMesh): Nullable<AbstractMesh> {
    const assetMesh = getAssetMesh(this.context.scene, mesh);
    if (assetMesh && assetMesh.skeleton) {
      const objSpaceVertices = assetMesh.skeleton.bones.map((bone) =>
        bone
          .getDirection(this.context.triangleMesh.up)
          .scale(this.context.scalingRatio),
      );

      const edges = objSpaceVertices.map((v, i) =>
        v.subtract(objSpaceVertices[(i + 1) % 3]),
      );

      assetMesh.metadata.vertices = objSpaceVertices;
      assetMesh.metadata.edges = edges;

      return assetMesh;
    }
    // eslint-disable-next-line no-console
    console.assert(typeof assetMesh === 'object', 'Asset not found');
    return null;
  }

  public flipNode(triangleMesh: AbstractMesh, triangle: Triangle): Node {
    let flipNode = this.context.scene.getNodeByName(
      `flipNode${triangle.getId()}`,
    );
    if (!flipNode) {
      flipNode = new TransformNode(`flipNode${triangle.getId()}`);
      flipNode.parent = triangleMesh.parent;
      // eslint-disable-next-line no-param-reassign
      triangleMesh.parent = flipNode;
    }
    return flipNode;
  }

  public onDown(pointerInfo: PointerInfo): void {
    const mesh = pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
    if (mesh) {
      this.firstTriangle = this.extractMesh(mesh);
    }
  }

  public onMove(): void {
    const inverseScaling = 1 / (this.context.scalingRatio * k_triangleScale);

    if (this.firstTriangle) {
      const firstTriangle = this.firstTriangle.metadata.triangle;

      const pickinfo = this.context.scene.pick(
        this.context.scene.pointerX,
        this.context.scene.pointerY,
      );

      if (
        pickinfo?.pickedMesh &&
        pickinfo?.pickedMesh?.metadata.triangle.triangleId !==
          firstTriangle.triangleId
      ) {
        const mesh = pickinfo?.pickedMesh;
        if (mesh) {
          this.secondTriangle = this.extractMesh(mesh);

          if (this.secondTriangle) {
            const secondTriangle = this.secondTriangle.metadata.triangle;

            const flipNodeFirstTriangle = this.flipNode(
              this.firstTriangle,
              firstTriangle,
            );
            const flipNodeSecondTriangle = this.flipNode(
              this.secondTriangle,
              secondTriangle,
            );

            // const firstEdges = this.firstTriangle.metadata.edges;
            // const secondEdges = this.secondTriangle.metadata.edges;
            // const firstVertices = this.firstTriangle.metadata.vertices;
            // const secondVertices = this.secondTriangle.metadata.vertices;

            // flipNode.position = Vector3.Center(
            //   objSpaceVertices[1],
            //   objSpaceVertices[2],
            // ).scale(inverseScaling);
            // assetMesh.position = Vector3.Center(
            //   objSpaceVertices[1],
            //   objSpaceVertices[2],
            // ).scale(-inverseScaling);

            // this.context.scene.registerBeforeRender(() => {
            //   flipNodeFirst.rotate(edges[1], Math.PI * 0.01);
            //   if (limit < Math.PI * 2) {
            //     flipNode.rotate(edges[1], Math.PI * 0.01);
            //     limit += Math.PI * 0.1;
            //   }
            // });
          }
        }
      }
    }
  }

  public onRelease(pointerInfo: PointerInfo): void {
    // eslint-disable-next-line no-console
    console.log(pointerInfo);
  }
}

export default FlipGesture;
