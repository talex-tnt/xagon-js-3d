import {
  // MeshBuilder, // #debug
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  Scalar,
  StandardMaterial,
  AbstractMesh,
  MeshBuilder,
} from '@babylonjs/core';
import { addAxisToScene } from 'utils'; // #debug
import TriangleMesh from '..';
import IMeshState from './IMeshState';
import MeshStateIdle from './MeshStateIdle';

class MeshStateRotating extends IMeshState {
  private nextState: Nullable<IMeshState> = null;

  private triangleMesh: TriangleMesh;

  private adjacentTriangleMesh: TriangleMesh;

  private scene: Scene;

  private firstEdges: Nullable<Vector3[]>;

  private firstVertices: Nullable<Vector3[]>;

  private rotationAxis: Vector3 = Vector3.Zero();

  private rotationAngle = 0;

  private flipNode: Nullable<TransformNode> = null;

  private scalingNode: Nullable<TransformNode> = null;

  private deltaShift: Vector3 = Vector3.Zero();

  private amount = 0;

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
    this.firstEdges = this.triangleMesh.getEdges();
    this.firstVertices = this.triangleMesh.getVertices();

    const adjacentsVerticesMap = this.triangleMesh.getAdjacentsVerticesMap(
      this.adjacentTriangleMesh.getTriangle(),
    );

    if (this.triangleMesh && this.adjacentTriangleMesh) {
      const triangleMesh = this.triangleMesh.getTriangleMesh();
      if (triangleMesh) {
        this.scalingNode = triangleMesh.parent as TransformNode;

        if (this.scalingNode) {
          const flipNodeFirstTriangle = this.scalingNode
            .parent as TransformNode;

          if (this.firstEdges && this.firstVertices) {
            const firstTriangleVerticesIndicesKeys =
              Object.keys(adjacentsVerticesMap);
            const firstTriangleVerticesIndices = [
              Number(firstTriangleVerticesIndicesKeys[0]),
              Number(firstTriangleVerticesIndicesKeys[1]),
            ];
            // const secondTriangleVerticesIndices =
            //   Object.values(adjacentsVerticesMap);

            // const secondTriangleMeshVerticesIndices: number[] =
            //   this.triangleMesh.getTriangleMeshVerticeIndices(
            //     secondTriangleVerticesIndices,
            //   );

            const firstTriangleMeshIndicesSum =
              this.triangleMesh.getTriangleMeshIndicesSum(
                firstTriangleVerticesIndices,
              );

            const firstTriangleMeshFlipEdgeIndex =
              this.triangleMesh.getTriangleMeshFlipEdgeIndex(
                firstTriangleMeshIndicesSum,
              );

            if (flipNodeFirstTriangle) {
              const flipNodeFirstTriangleCenter = Vector3.Zero(); // node position in object space
              const adjacentEdgeObjSpaceCenterPoint = Vector3.Center(
                this.firstVertices[Number(firstTriangleVerticesIndices[0])],
                this.firstVertices[Number(firstTriangleVerticesIndices[1])],
              );

              flipNodeFirstTriangle.setPositionWithLocalVector(
                adjacentEdgeObjSpaceCenterPoint,
              );
              this.scalingNode.position = flipNodeFirstTriangleCenter.subtract(
                flipNodeFirstTriangle.position,
              );
              this.flipNode = flipNodeFirstTriangle;

              const firstTriangleWorldSpaceVertices = this.triangleMesh
                .getTriangle()
                .getVertices();

              const adjacentEdgeWorldSpace = firstTriangleWorldSpaceVertices[
                Number(firstTriangleVerticesIndices[0])
              ].subtract(
                firstTriangleWorldSpaceVertices[
                  Number(firstTriangleVerticesIndices[1])
                ],
              );

              const adjacentEdgeWorldSpaceCenterPoint = Vector3.Center(
                firstTriangleWorldSpaceVertices[
                  Number(firstTriangleVerticesIndices[0])
                ],
                firstTriangleWorldSpaceVertices[
                  Number(firstTriangleVerticesIndices[1])
                ],
              );

              const firstTriangleRotationVector = this.triangleMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(adjacentEdgeWorldSpaceCenterPoint);
              const secondTriangleRotationVector = this.adjacentTriangleMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(adjacentEdgeWorldSpaceCenterPoint);

              const rotationDownAngle = Math.abs(
                Vector3.GetAngleBetweenVectors(
                  firstTriangleRotationVector,
                  secondTriangleRotationVector,
                  adjacentEdgeWorldSpace,
                ),
              );

              if (direction === 1) {
                this.rotationAngle = -rotationDownAngle;
              } else {
                this.rotationAngle = Math.PI * 2 - rotationDownAngle;
              }

              if (
                // direction &&
                this.adjacentTriangleMesh &&
                this.adjacentTriangleMesh.getTriangleMesh()
              ) {
                // #BONES
                // const firstTriangleMeshSkeleton =
                //   this.triangleMesh.getTriangleMesh()?.skeleton?.bones;
                // const secondTriangleMeshSkeleton =
                //   this.adjacentTriangleMesh.getTriangleMesh()?.skeleton?.bones;

                // const firstTriangleBonesIndices =
                //   this.triangleMesh.getTriangleMeshVerticeIndices(
                //     firstTriangleVerticesIndices,
                //   );

                const shiftRatio =
                  firstTriangleRotationVector.length() /
                  secondTriangleRotationVector.length();

                this.deltaShift = this.scalingNode.position.subtract(
                  this.scalingNode.position.scale(1 / shiftRatio),
                );

                this.rotationAxis =
                  this.firstEdges[firstTriangleMeshFlipEdgeIndex];

                // #DEBUG
                //
                // addAxisToScene({
                //   scene: this.scene,
                //   size: 0.5,
                //   parent: flipNodeFirstTriangle,
                // });
                // MeshBuilder.CreateLines('line1', {
                //   points: [
                //     adjacentEdgeWorldSpaceCenterPoint,
                //     this.triangleMesh.getTriangle().getCenterPoint(),
                //   ],
                // });
                // MeshBuilder.CreateLines('line2', {
                //   points: [
                //     this.adjacentTriangleMesh.getTriangle().getCenterPoint(),
                //     adjacentEdgeWorldSpaceCenterPoint,
                //   ],
                // });
                // MeshBuilder.CreateLines('line3', {
                //   points: [
                //     firstTriangleWorldSpaceVertices[
                //       Number(firstTriangleVerticesIndices[0])
                //     ],
                //     firstTriangleWorldSpaceVertices[
                //       Number(firstTriangleVerticesIndices[1])
                //     ],
                //   ],
                // });
                //
              }
            }
          }
        }
      }
    }
  }

  public update(): Nullable<IMeshState> {
    const rotationSpeed = this.getRotationSpeed();

    if (this.amount < 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, this.amount),
        );

      this.scalingNode.position = this.scalingNode.position.subtract(
        this.deltaShift.scale(rotationSpeed),
      );
      this.amount += rotationSpeed;
      // #DEBUG rotation arc
      // MeshBuilder.CreateLines('*', {
      //   points: [
      //     this.scalingNode.getAbsolutePosition(),
      //     this.scalingNode.getAbsolutePosition().scale(1.01),
      //   ],
      // });
    } else if (this.amount >= 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, 0),
        );

      this.scalingNode.position = this.scalingNode.position.add(
        this.deltaShift,
      );

      const triangle = this.triangleMesh.getTriangle();
      const triangleMesh = this.triangleMesh.getTriangleMesh();

      const material = this.scene.getMaterialByName(
        `meshMaterial${triangle.getId()}`,
      );
      (material as StandardMaterial).diffuseColor = this.adjacentTriangleMesh
        .getTriangle()
        .getColor();
      (triangleMesh as AbstractMesh).material = material;

      this.nextState = new MeshStateIdle({
        triangleMesh: this.triangleMesh,
        scene: this.scene,
      });
    }

    return this.nextState;
  }

  public getRotationSpeed(): number {
    const deltaTimeInMillis = this.scene.getEngine().getDeltaTime();
    const rotationSpeed = deltaTimeInMillis / 1000;
    return rotationSpeed;
  }
}
export default MeshStateRotating;
