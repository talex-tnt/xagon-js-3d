import {
  AbstractMesh,
  PointerInfo,
  Scene,
  TransformNode,
  Nullable,
  StandardMaterial,
  Vector3,
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

  private angleFlip: number;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangle = null;
    this.secondTriangle = null;
    this.angleFlip = 0;
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

  public getFlipNode(
    triangleMesh: AbstractMesh,
    triangle: Triangle,
  ): TransformNode {
    let flipNode = this.context.scene.getNodeByName(
      `flipNode${triangle.getId()}`,
    ) as TransformNode;
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

            const flipNodeFirstTriangle = this.getFlipNode(
              this.firstTriangle,
              firstTriangle,
            );
            const flipNodeSecondTriangle = this.getFlipNode(
              this.secondTriangle,
              secondTriangle,
            );

            // const materialFirstTriangle = new StandardMaterial(
            //   `material${firstTriangle.getId()}`,
            //   this.context.scene,
            // );
            // const materialSecondTriangle = new StandardMaterial(
            //   `material${secondTriangle.getId()}`,
            //   this.context.scene,
            // );

            // const firstType = firstTriangle.getType();
            // const secondType = secondTriangle.getType();
            // firstTriangle.setType(secondType);
            // secondTriangle.setType(firstType);

            // materialFirstTriangle.diffuseColor = secondTriangle.getColor();
            // materialSecondTriangle.diffuseColor = firstTriangle.getColor();

            // this.firstTriangle.material = materialFirstTriangle;
            // this.secondTriangle.material = materialSecondTriangle;

            const firstEdges = this.firstTriangle.metadata.edges;
            const secondEdges = this.secondTriangle.metadata.edges;
            const firstVertices = this.firstTriangle.metadata.vertices;
            const secondVertices = this.secondTriangle.metadata.vertices;

            flipNodeFirstTriangle.position = Vector3.Center(
              firstVertices[1],
              firstVertices[2],
            ).scale(inverseScaling);
            this.firstTriangle.position = Vector3.Center(
              firstVertices[1],
              firstVertices[2],
            ).scale(-inverseScaling);
            // flipNodeFirstTriangle.rotate(firstEdges[0], this.angleFlip);
            // if (this.angleFlip < Math.PI) {
            //   this.angleFlip += Math.PI * 0.001;
            // }

            this.context.scene.registerBeforeRender(() => {
              flipNodeFirstTriangle.rotate(firstEdges[0], Math.PI * 0.01);
            });
          }
        }
      }
    }
  }

  public onRelease(pointerInfo: PointerInfo): void {
    if (this.firstTriangle && this.secondTriangle) {
      const firstTriangle = this.firstTriangle.metadata.triangle;
      const secondTriangle = this.secondTriangle.metadata.triangle;

      const materialFirstTriangle = new StandardMaterial(
        `material${firstTriangle.getId()}`,
        this.context.scene,
      );
      const materialSecondTriangle = new StandardMaterial(
        `material${secondTriangle.getId()}`,
        this.context.scene,
      );

      const firstType = firstTriangle.getType();
      const secondType = secondTriangle.getType();
      console.log(firstType, secondType);

      materialFirstTriangle.diffuseColor = secondTriangle.getColor();
      materialSecondTriangle.diffuseColor = firstTriangle.getColor();

      firstTriangle.setType(secondType);
      secondTriangle.setType(firstType);

      this.firstTriangle.material = materialFirstTriangle;
      this.secondTriangle.material = materialSecondTriangle;

      // eslint-disable-next-line no-console
      console.log(pointerInfo);
    }
  }
}

export default FlipGesture;
