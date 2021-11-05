import { Nullable, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import TriangleMesh from '..';
import IMeshState from './IMeshState';
// import MeshStateIdle from './MeshStateIdle';

class MeshStateRotating extends IMeshState {
  private nextState: Nullable<IMeshState> = null;

  private triangleMesh: TriangleMesh;

  private adjacentTriangleMesh: TriangleMesh;

  private scene: Scene;

  private direction: number | undefined;

  private angle = 0;

  public constructor({
    thisTriangleMesh,
    adjacentTriangleMesh,
    scene,
    direction,
  }: {
    thisTriangleMesh: TriangleMesh;
    adjacentTriangleMesh: TriangleMesh;
    scene: Scene;
    direction?: number;
  }) {
    super();
    this.triangleMesh = thisTriangleMesh;
    this.adjacentTriangleMesh = adjacentTriangleMesh;
    this.scene = scene;
    this.direction = direction;
  }

  public update(): Nullable<IMeshState> {
    const adjacentsVerticesMap = this.triangleMesh.getAdjacentsVerticesMap(
      this.adjacentTriangleMesh.getTriangle(),
    );

    if (this.triangleMesh && this.adjacentTriangleMesh) {
      const triangleMesh = this.triangleMesh.getTriangleMesh();
      if (triangleMesh) {
        const scalingNodeFirstTriangle = triangleMesh.parent as TransformNode;
        if (scalingNodeFirstTriangle) {
          const flipNodeFirstTriangle =
            scalingNodeFirstTriangle.parent as TransformNode;

          const firstEdges = this.triangleMesh.getEdges();
          const firstVertices = this.triangleMesh.getVertices();

          if (firstEdges && firstVertices) {
            const firstTriangleVerticeIndices =
              Object.keys(adjacentsVerticesMap);

            const firstTriangleMeshVerticeIndices: number[] =
              this.triangleMesh.getTriangleMeshVerticeIndices(
                firstTriangleVerticeIndices,
              );

            const firstTriangleMeshIndicesSum =
              this.triangleMesh.getTriangleMeshIndicesSum(
                firstTriangleMeshVerticeIndices,
              );

            const firstTriangleMeshFlipEdgeIndex =
              this.triangleMesh.getTriangleMeshFlipEdgeIndex(
                firstTriangleMeshIndicesSum,
              );

            if (flipNodeFirstTriangle /* && flipNodeSecondTriangle */) {
              const flipNodeFirstTriangleCenter = Vector3.Zero(); // node position in object space
              const flipFirstTriangleEdgeCenter = Vector3.Center(
                firstVertices[firstTriangleMeshVerticeIndices[0]],
                firstVertices[firstTriangleMeshVerticeIndices[1]],
              );

              flipNodeFirstTriangle.position = flipNodeFirstTriangleCenter.add(
                flipFirstTriangleEdgeCenter,
              );
              scalingNodeFirstTriangle.position =
                flipNodeFirstTriangleCenter.subtract(
                  flipFirstTriangleEdgeCenter,
                );

              const rotationSpeed = this.getRotationSpeed();
              const { direction } = this;

              this.angle += rotationSpeed;

              if (direction) {
                switch (direction) {
                  case 1: {
                    if (this.angle < Math.PI) {
                      flipNodeFirstTriangle.rotate(
                        firstEdges[firstTriangleMeshFlipEdgeIndex],
                        rotationSpeed * direction,
                      );
                    }
                    break;
                  }
                  case -1: {
                    if (this.angle < Math.PI) {
                      flipNodeFirstTriangle.rotate(
                        firstEdges[firstTriangleMeshFlipEdgeIndex],
                        rotationSpeed * direction,
                      );
                    }
                    break;
                  }
                  default:
                }
              }
            }
          }
        }
      }
    }
    return this.nextState;
  }

  public getRotationSpeed(): number {
    const deltaTimeInMillis = this.scene.getEngine().getDeltaTime();
    const rotationSpeed = (60 / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    return rotationSpeed;
  }
}
export default MeshStateRotating;
