import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  TransformNode,
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

  private firstTriangleMesh: Nullable<AbstractMesh>;

  private secondTriangleMesh: Nullable<AbstractMesh>;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
  }

  private setRotationSpeed(rpm: number): number {
    const deltaTimeInMillis = this.context.scene.getEngine().getDeltaTime();
    const rotationSpeed = (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    return rotationSpeed;
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
        v.subtract(objSpaceVertices[(i + 1) % objSpaceVertices.length]),
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

          this.firstTriangleMesh = assetMesh;
        }
      }
    }
  }

  public onMove(): void {
    if (this.firstTriangleMesh) {
      const firstTriangle = this.firstTriangleMesh.metadata.triangle;

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

              this.secondTriangleMesh = assetMesh;
            }
          }

          if (this.secondTriangleMesh) {
            const secondTriangle = this.secondTriangleMesh.metadata.triangle;

            // const hasAdjacent = firstTriangle
            //   .getAdjacents()
            //   .find((adj: Triangle) => adj.getId() === secondTriangle.getId());
            // console.log(hasAdjacent);

            const scalingNodeFirstTriangle = this.firstTriangleMesh
              .parent as TransformNode;
            const flipNodeFirstTriangle =
              scalingNodeFirstTriangle?.parent as TransformNode;
            const scalingNodeSecondTriangle = this.secondTriangleMesh
              .parent as TransformNode;
            const flipNodeSecondTriangle =
              scalingNodeSecondTriangle?.parent as TransformNode;

            const firstEdges = this.firstTriangleMesh.metadata.edges;
            const secondEdges = this.secondTriangleMesh.metadata.edges;
            const firstVertices = this.firstTriangleMesh.metadata.vertices;
            const secondVertices = this.secondTriangleMesh.metadata.vertices;

            if (flipNodeFirstTriangle && flipNodeSecondTriangle) {
              const flipNodeFirstTriangleCenter = Vector3.Zero(); // node position in object space
              const flipFirstTriangleEdgeCenter = Vector3.Center(
                firstVertices[0],
                firstVertices[1],
              );

              flipNodeFirstTriangle.position = flipNodeFirstTriangleCenter.add(
                flipFirstTriangleEdgeCenter,
              );
              scalingNodeFirstTriangle.position =
                flipNodeFirstTriangleCenter.subtract(
                  flipFirstTriangleEdgeCenter,
                );

              const flipNodeSecondTriangleCenter = Vector3.Zero(); // node position in object space
              const flipSecondTriangleEdgeCenter = Vector3.Center(
                secondVertices[0],
                secondVertices[2],
              );

              flipNodeSecondTriangle.position =
                flipNodeSecondTriangleCenter.add(flipSecondTriangleEdgeCenter);
              scalingNodeSecondTriangle.position =
                flipNodeSecondTriangleCenter.subtract(
                  flipSecondTriangleEdgeCenter,
                );
              const rotationSpeed = this.setRotationSpeed(1);

              this.context.scene.registerBeforeRender(() => {
                flipNodeFirstTriangle.rotate(firstEdges[0], rotationSpeed);
                flipNodeSecondTriangle.rotate(secondEdges[2], -rotationSpeed);
              });
            }
          }
        }
      }
    }
  }

  public onRelease(pointerInfo: PointerInfo): void {
    // DEBUG TRIANGLE TYPE CHANGE ONRELEASE
    // if (this.firstTriangleMesh && this.secondTriangleMesh) {
    //   const firstTriangle = this.firstTriangleMesh.metadata.triangle;
    //   const secondTriangle = this.secondTriangleMesh.metadata.triangle;
    //   const materialFirstTriangle = new StandardMaterial(
    //     `material${firstTriangle.getId()}`,
    //     this.context.scene,
    //   );
    //   const materialSecondTriangle = new StandardMaterial(
    //     `material${secondTriangle.getId()}`,
    //     this.context.scene,
    //   );
    //   const firstType = firstTriangle.getType();
    //   const secondType = secondTriangle.getType();
    //   console.log(firstType, secondType);
    //   materialFirstTriangle.diffuseColor = secondTriangle.getColor();
    //   materialSecondTriangle.diffuseColor = firstTriangle.getColor();
    //   firstTriangle.setType(secondType);
    //   secondTriangle.setType(firstType);
    //   this.firstTriangleMesh.material = materialFirstTriangle;
    //   this.secondTriangleMesh.material = materialSecondTriangle;
    //   // eslint-disable-next-line no-console
    //   console.log(pointerInfo);
    // }
  }
}

export default FlipGesture;
