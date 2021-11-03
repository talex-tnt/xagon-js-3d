import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  TransformNode,
} from '@babylonjs/core';
import { k_epsilon, k_triangleScale } from 'constants/index';
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

  private adjacentsMap: Nullable<Record<number, number>>;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
    this.adjacentsMap = null;
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
        pickinfo &&
        pickinfo.pickedMesh &&
        pickinfo.pickedMesh.metadata.triangle.triangleId !==
          firstTriangle.triangleId
      ) {
        const mesh = pickinfo.pickedMesh;
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

            if (!this.adjacentsMap) {
              const firstTriangleVertices = firstTriangle.getVertices();
              const secondTriangleVertices = secondTriangle.getVertices();
              const adjacentsVertices: Record<number, number> = {};
              firstTriangleVertices.forEach(
                (
                  firstTriangleVertice: Vector3,
                  indexFirstTriangleVertice: number,
                ) => {
                  secondTriangleVertices.forEach(
                    (
                      secondTriangleVertice: Vector3,
                      indexSecondTriangleVertice: number,
                    ) => {
                      if (
                        secondTriangleVertice
                          .subtract(firstTriangleVertice)
                          .length() < k_epsilon
                      ) {
                        adjacentsVertices[indexFirstTriangleVertice] =
                          indexSecondTriangleVertice;
                      }
                    },
                  );
                },
              );
              this.adjacentsMap = adjacentsVertices;
            }

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

            const firstTriangleVerticeIndices: number[] = [];
            const secondTriangleVerticeIndices: number[] = [];

            Object.keys(this.adjacentsMap).forEach((k, i) => {
              switch (k) {
                case '0':
                  firstTriangleVerticeIndices[i] = 2;
                  break;
                case '1':
                  firstTriangleVerticeIndices[i] = 1;
                  break;
                case '2':
                  firstTriangleVerticeIndices[i] = 0;
                  break;
                default:
              }
            });
            Object.values(this.adjacentsMap).forEach((v, i) => {
              switch (v) {
                case 0:
                  secondTriangleVerticeIndices[i] = 2;
                  break;
                case 1:
                  secondTriangleVerticeIndices[i] = 1;
                  break;
                case 2:
                  secondTriangleVerticeIndices[i] = 0;
                  break;
                default:
              }
            });

            console.log(
              firstTriangleVerticeIndices,
              secondTriangleVerticeIndices,
            );

            const firstMeshIndex = firstTriangleVerticeIndices.reduce(
              (curr, prev) => curr + prev,
            );
            const secondMeshIndex = secondTriangleVerticeIndices.reduce(
              (curr, prev) => curr + prev,
            );

            let firstMeshFlipEdgeIndex: number;
            let secondMeshFlipEdgeIndex: number;

            switch (firstMeshIndex) {
              case 1:
                firstMeshFlipEdgeIndex = 0;
                break;
              case 2:
                firstMeshFlipEdgeIndex = 2;
                break;
              case 3:
                firstMeshFlipEdgeIndex = 1;
                break;
              default:
            }
            switch (secondMeshIndex) {
              case 1:
                secondMeshFlipEdgeIndex = 0;
                break;
              case 2:
                secondMeshFlipEdgeIndex = 2;
                break;
              case 3:
                secondMeshFlipEdgeIndex = 1;
                break;
              default:
            }

            if (flipNodeFirstTriangle && flipNodeSecondTriangle) {
              const flipNodeFirstTriangleCenter = Vector3.Zero(); // node position in object space
              const flipFirstTriangleEdgeCenter = Vector3.Center(
                firstVertices[firstTriangleVerticeIndices[0]],
                firstVertices[firstTriangleVerticeIndices[1]],
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
                secondVertices[secondTriangleVerticeIndices[0]],
                secondVertices[secondTriangleVerticeIndices[1]],
              );
              const inverseScaling = 1 / k_triangleScale;

              flipNodeSecondTriangle.position = flipNodeSecondTriangleCenter
                .add(flipSecondTriangleEdgeCenter)
                .scale(inverseScaling);
              scalingNodeSecondTriangle.position = flipNodeSecondTriangleCenter
                .subtract(flipSecondTriangleEdgeCenter)
                .scale(inverseScaling);

              const rotationSpeed = this.setRotationSpeed(1);

              this.context.scene.registerBeforeRender(() => {
                flipNodeFirstTriangle.rotate(
                  firstEdges[firstMeshFlipEdgeIndex],
                  rotationSpeed,
                );
                flipNodeSecondTriangle.rotate(
                  secondEdges[secondMeshFlipEdgeIndex],
                  -rotationSpeed,
                );
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
    // {
    //   edge[0]: {
    //     meshPoints(0,1),
    //     trianglePoints(1,2)
    //   },
    //   edge[1]: {
    //     meshPoints(1,2),
    //     trianglePoints(0,1)
    //   },
    //   edge[2]: {
    //     meshPoints(0,2),
    //     trianglePoints(0,2)
    //   }
    // }
  }
}

export default FlipGesture;
