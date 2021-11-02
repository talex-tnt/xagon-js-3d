import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { getAssetMesh } from 'utils/scene';
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

  public computeObjSpaceData(assetMesh: AbstractMesh):
    | {
        vertices: Vector3[];
        edges: Vector3[];
      }
    | undefined {
    if (assetMesh && assetMesh.skeleton) {
      const objSpaceVertices = assetMesh.skeleton.bones.map((bone) =>
        bone
          .getDirection(this.context.triangleMesh.up)
          .scale(this.context.scalingRatio),
      );

      const edges = objSpaceVertices.map((v, i) =>
        v.subtract(objSpaceVertices[(i + 1) % 3]),
      );

      return { vertices: objSpaceVertices, edges };
    }
    // eslint-disable-next-line no-console
    console.assert(typeof assetMesh === 'object', 'Asset not found');
    return undefined;
  }

  public onDown(pointerInfo: PointerInfo): void {
    const mesh = pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
    if (mesh) {
      const assetMesh = getAssetMesh({
        scene: this.context.scene,
        triangleMesh: mesh,
      });
      if (assetMesh) {
        const data = this.computeObjSpaceData(assetMesh);
        if (data) {
          assetMesh.metadata.vertices = data.vertices;
          assetMesh.metadata.edges = data.edges;

          this.firstTriangle = assetMesh;
        }
      }
    }
  }

  public onMove(): void {
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
          const assetMesh = getAssetMesh({
            scene: this.context.scene,
            triangleMesh: mesh,
          });
          if (assetMesh) {
            const data = this.computeObjSpaceData(assetMesh);
            if (data) {
              assetMesh.metadata.vertices = data.vertices;
              assetMesh.metadata.edges = data.edges;

              this.secondTriangle = assetMesh;
            }
          }

          if (this.secondTriangle) {
            const secondTriangle = this.secondTriangle.metadata.triangle;

            const scalingNodeFirstTriangle = this.firstTriangle.parent;
            const flipNodeFirstTriangle = scalingNodeFirstTriangle?.parent;
            const scalingNodeSecondTriangle = this.secondTriangle.parent;
            const flipNodeSecondTriangle = scalingNodeSecondTriangle?.parent;

            const firstEdges = this.firstTriangle.metadata.edges;
            const secondEdges = this.secondTriangle.metadata.edges;
            const firstVertices = this.firstTriangle.metadata.vertices;
            const secondVertices = this.secondTriangle.metadata.vertices;

            if (flipNodeFirstTriangle && flipNodeSecondTriangle) {
              flipNodeFirstTriangle.position = Vector3.Center(
                firstVertices[0],
                firstVertices[1],
              );
              scalingNodeFirstTriangle.position = Vector3.Center(
                firstVertices[0],
                firstVertices[1],
              ).scale(-1);
              flipNodeSecondTriangle.position = Vector3.Center(
                secondVertices[0],
                secondVertices[2],
              );
              scalingNodeSecondTriangle.position = Vector3.Center(
                secondVertices[0],
                secondVertices[2],
              ).scale(-1);

              this.context.scene.registerBeforeRender(() => {
                flipNodeFirstTriangle.rotate(firstEdges[0], Math.PI * 0.01);
                flipNodeSecondTriangle.rotate(secondEdges[2], -Math.PI * 0.01);
              });
            }
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
