import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  TransformNode,
} from '@babylonjs/core';
import { k_epsilon } from 'constants/index';
import Triangle from 'models/Triangle';
import TriangleMesh from 'rendering/TriangleMesh';
import { getAssetMesh } from 'utils/scene';
import Gesture from './Gesture';

interface GestureContext {
  scene: Scene;
  triangleMesh: AbstractMesh;
  scalingRatio: number;
}

class FlipGesture extends Gesture {
  private context: GestureContext;

  private firstTriangleMesh: Nullable<TriangleMesh>;

  private secondTriangleMesh: Nullable<TriangleMesh>;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
  }

  public getAdjacentsVerticesMap({
    firstTriangle,
    secondTriangle,
  }: {
    firstTriangle: Triangle;
    secondTriangle: Triangle;
  }): Record<number, number> {
    const firstTriangleVertices = firstTriangle.getVertices();
    const secondTriangleVertices = secondTriangle.getVertices();
    const adjacentsVertices: Record<number, number> = {};
    firstTriangleVertices.forEach(
      (firstTriangleVertice: Vector3, indexFirstTriangleVertice: number) => {
        secondTriangleVertices.forEach(
          (
            secondTriangleVertice: Vector3,
            indexSecondTriangleVertice: number,
          ) => {
            if (
              secondTriangleVertice.subtract(firstTriangleVertice).length() <
              k_epsilon
            ) {
              adjacentsVertices[indexFirstTriangleVertice] =
                indexSecondTriangleVertice;
            }
          },
        );
      },
    );
    return adjacentsVertices;
  }

  public getTriangleMeshVerticeIndices(
    triangleVerticeIndices: string[] | number[],
  ): number[] {
    const triangleMeshVerticeIndices: number[] = [];
    triangleVerticeIndices.forEach((k, i) => {
      switch (String(k)) {
        case '0':
          triangleMeshVerticeIndices[i] = 2;
          break;
        case '1':
          triangleMeshVerticeIndices[i] = 1;
          break;
        case '2':
          triangleMeshVerticeIndices[i] = 0;
          break;
        default:
      }
    });
    return triangleMeshVerticeIndices;
  }

  public getTriangleMeshIndicesSum(
    triangleMeshVerticeIndices: number[],
  ): number {
    return triangleMeshVerticeIndices.reduce((curr, prev) => curr + prev);
  }

  public getTriangleMeshFlipEdgeIndex(triangleMeshIndicesSum: number): number {
    let triangleMeshFlipEdgeIndex = 0;
    switch (triangleMeshIndicesSum) {
      case 1:
        triangleMeshFlipEdgeIndex = 0;
        break;
      case 2:
        triangleMeshFlipEdgeIndex = 2;
        break;
      case 3:
        triangleMeshFlipEdgeIndex = 1;
        break;
      default:
    }
    return triangleMeshFlipEdgeIndex;
  }

  public setRotationSpeed(rpm: number): number {
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
      const originalMesh = getAssetMesh({
        scene: this.context.scene,
        triangleMesh: mesh,
      });

      if (originalMesh) {
        const triangleMesh = originalMesh?.metadata.triangleMesh;
        if (triangleMesh) {
          const data = this.computeObjSpaceData(originalMesh);
          if (data) {
            triangleMesh.setVertices(data.vertices);
            triangleMesh.setEdges(data.edges);

            this.firstTriangleMesh = triangleMesh;
          }
        }
      }
    }
  }

  public onMove(): void {
    if (this.firstTriangleMesh) {
      const firstTriangle = this.firstTriangleMesh.getTriangle();

      const pickinfo = this.context.scene.pick(
        this.context.scene.pointerX,
        this.context.scene.pointerY,
      );

      if (
        pickinfo &&
        pickinfo.pickedMesh &&
        pickinfo.pickedMesh.metadata.triangle.getId() !== firstTriangle.getId()
      ) {
        const mesh = pickinfo.pickedMesh;

        if (mesh) {
          const originalMesh = getAssetMesh({
            scene: this.context.scene,
            triangleMesh: mesh,
          });
          if (originalMesh) {
            const assetMesh = originalMesh.metadata.triangleMesh;
            const data = this.computeObjSpaceData(originalMesh);
            if (data) {
              assetMesh.setVertices(data.vertices);
              assetMesh.setEdges(data.edges);

              this.secondTriangleMesh = assetMesh;
            }
          }

          if (this.secondTriangleMesh) {
            const secondTriangle = this.secondTriangleMesh.getTriangle();
            const firstTriangleMesh = this.firstTriangleMesh.getTriangleMesh();
            const secondTriangleMesh =
              this.secondTriangleMesh.getTriangleMesh();
            if (firstTriangle.isAdjacent(secondTriangle)) {
              this.firstTriangleMesh.onFlip(this.secondTriangleMesh);
              this.secondTriangleMesh.onFlip(this.firstTriangleMesh);
              const adjacentsVerticesMap = this.getAdjacentsVerticesMap({
                firstTriangle,
                secondTriangle,
              });

              if (firstTriangleMesh && secondTriangleMesh) {
                const scalingNodeFirstTriangle =
                  firstTriangleMesh.parent as TransformNode;
                const flipNodeFirstTriangle =
                  scalingNodeFirstTriangle?.parent as TransformNode;
                const scalingNodeSecondTriangle =
                  secondTriangleMesh.parent as TransformNode;
                const flipNodeSecondTriangle =
                  scalingNodeSecondTriangle?.parent as TransformNode;

                const firstEdges = this.firstTriangleMesh.getEdges();
                const secondEdges = this.secondTriangleMesh.getEdges();
                const firstVertices = this.firstTriangleMesh.getVertices();
                const secondVertices = this.secondTriangleMesh.getVertices();

                if (
                  firstEdges &&
                  secondEdges &&
                  firstVertices &&
                  secondVertices
                ) {
                  const firstTriangleVerticeIndices =
                    Object.keys(adjacentsVerticesMap);
                  const secondTriangleVerticeIndices =
                    Object.values(adjacentsVerticesMap);

                  const firstTriangleMeshVerticeIndices: number[] =
                    this.getTriangleMeshVerticeIndices(
                      firstTriangleVerticeIndices,
                    );
                  const secondTriangleMeshVerticeIndices: number[] =
                    this.getTriangleMeshVerticeIndices(
                      secondTriangleVerticeIndices,
                    );

                  const firstTriangleMeshIndicesSum =
                    this.getTriangleMeshIndicesSum(
                      firstTriangleMeshVerticeIndices,
                    );
                  const secondTriangleMeshIndicesSum =
                    this.getTriangleMeshIndicesSum(
                      secondTriangleMeshVerticeIndices,
                    );

                  const firstTriangleMeshFlipEdgeIndex =
                    this.getTriangleMeshFlipEdgeIndex(
                      firstTriangleMeshIndicesSum,
                    );
                  const secondTriangleMeshFlipEdgeIndex =
                    this.getTriangleMeshFlipEdgeIndex(
                      secondTriangleMeshIndicesSum,
                    );

                  if (flipNodeFirstTriangle && flipNodeSecondTriangle) {
                    const flipNodeFirstTriangleCenter = Vector3.Zero(); // node position in object space
                    const flipFirstTriangleEdgeCenter = Vector3.Center(
                      firstVertices[firstTriangleMeshVerticeIndices[0]],
                      firstVertices[firstTriangleMeshVerticeIndices[1]],
                    );

                    flipNodeFirstTriangle.position =
                      flipNodeFirstTriangleCenter.add(
                        flipFirstTriangleEdgeCenter,
                      );
                    scalingNodeFirstTriangle.position =
                      flipNodeFirstTriangleCenter.subtract(
                        flipFirstTriangleEdgeCenter,
                      );

                    const flipNodeSecondTriangleCenter = Vector3.Zero(); // node position in object space
                    const flipSecondTriangleEdgeCenter = Vector3.Center(
                      secondVertices[secondTriangleMeshVerticeIndices[0]],
                      secondVertices[secondTriangleMeshVerticeIndices[1]],
                    );

                    flipNodeSecondTriangle.position =
                      flipNodeSecondTriangleCenter.add(
                        flipSecondTriangleEdgeCenter,
                      );

                    scalingNodeSecondTriangle.position =
                      flipNodeSecondTriangleCenter.subtract(
                        flipSecondTriangleEdgeCenter,
                      );

                    const rotationSpeed = this.setRotationSpeed(1);

                    this.context.scene.registerBeforeRender(() => {
                      flipNodeFirstTriangle.rotate(
                        firstEdges[firstTriangleMeshFlipEdgeIndex],
                        rotationSpeed,
                      );
                      flipNodeSecondTriangle.rotate(
                        secondEdges[secondTriangleMeshFlipEdgeIndex],
                        -rotationSpeed,
                      );
                    });
                  }
                }
              }
            }
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
