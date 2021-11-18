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
  Space,
} from '@babylonjs/core';
// import { addAxisToScene } from 'utils'; #debug
import TriangleMesh from '..';
import IMeshState from './IMeshState';
import MeshStateIdle from './MeshStateIdle';

class MeshStateRotating extends IMeshState {
  private nextState: Nullable<IMeshState> = null;

  private triangleMesh: TriangleMesh;

  private adjacentTriangleMesh: TriangleMesh;

  private scene: Scene;

  private direction: number | undefined;

  private firstEdges: Nullable<Vector3[]>;

  private firstVertices: Nullable<Vector3[]>;

  private rotationAxis: Vector3 = Vector3.Zero();

  private rotationAngle = 0;

  private flipNode: Nullable<TransformNode> = null;

  private scalingNode: Nullable<TransformNode> = null;

  private deltaShift: Vector3;

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
    this.direction = direction;
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
            const firstTriangleVerticesIndices =
              Object.keys(adjacentsVerticesMap);

            const firstTriangleMeshVerticesIndices: number[] =
              this.triangleMesh.getTriangleMeshVerticeIndices(
                firstTriangleVerticesIndices,
              );

            const secondTriangleVerticesIndices =
              Object.values(adjacentsVerticesMap);

            const secondTriangleMeshVerticesIndices: number[] =
              this.triangleMesh.getTriangleMeshVerticeIndices(
                secondTriangleVerticesIndices,
              );

            const firstTriangleMeshIndicesSum =
              this.triangleMesh.getTriangleMeshIndicesSum(
                firstTriangleMeshVerticesIndices,
              );

            const firstTriangleMeshFlipEdgeIndex =
              this.triangleMesh.getTriangleMeshFlipEdgeIndex(
                firstTriangleMeshIndicesSum,
              );

            if (flipNodeFirstTriangle) {
              const flipNodeFirstTriangleCenter = Vector3.Zero(); // node position in object space

              const firstTriangleWorldSpaceVertices = this.triangleMesh
                .getTriangle()
                .getVertices();

              // const adjacentTriangleWorldSpaceVertices =
              //   this.adjacentTriangleMesh.getTriangle().getVertices();

              const adjacentEdgeWorldSpaceCenterPoint = Vector3.Center(
                firstTriangleWorldSpaceVertices[
                  Number(firstTriangleVerticesIndices[0])
                ],
                firstTriangleWorldSpaceVertices[
                  Number(firstTriangleVerticesIndices[1])
                ],
              );

              flipNodeFirstTriangle.setAbsolutePosition(
                adjacentEdgeWorldSpaceCenterPoint,
              );
              this.scalingNode.position = flipNodeFirstTriangleCenter.subtract(
                flipNodeFirstTriangle.position,
              );

              this.flipNode = flipNodeFirstTriangle;

              const firstTriangleRotationVector = this.triangleMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(adjacentEdgeWorldSpaceCenterPoint);

              const secondTriangleRotationVector = this.adjacentTriangleMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(adjacentEdgeWorldSpaceCenterPoint);

              // // #DEBUG_ADJACENT_EDGE
              // addAxisToScene({
              //   scene: this.scene,
              //   size: 0.5,
              //   parent: scalingNodeFirstTriangle,
              // });
              MeshBuilder.CreateLines('line1', {
                points: [
                  adjacentEdgeWorldSpaceCenterPoint,
                  this.triangleMesh.getTriangle().getCenterPoint(),
                ],
              });
              MeshBuilder.CreateLines('line2', {
                points: [
                  this.adjacentTriangleMesh.getTriangle().getCenterPoint(),
                  adjacentEdgeWorldSpaceCenterPoint,
                ],
              });
              MeshBuilder.CreateLines('line3', {
                points: [
                  firstTriangleWorldSpaceVertices[
                    Number(firstTriangleVerticesIndices[0])
                  ],
                  firstTriangleWorldSpaceVertices[
                    Number(firstTriangleVerticesIndices[1])
                  ],
                ],
              });
              //

              const rotationDownAngle = Math.abs(
                Vector3.GetAngleBetweenVectors(
                  firstTriangleRotationVector,
                  secondTriangleRotationVector,
                  this.firstEdges[firstTriangleMeshFlipEdgeIndex],
                ),
              );

              if (this.direction === 1) {
                this.rotationAngle = rotationDownAngle;
              } else {
                this.rotationAngle = -Math.PI * 2 + rotationDownAngle;
              }

              // const matrix = this.triangleMesh
              //   .getTriangleMesh()
              //   .computeWorldMatrix(true);

              // let test = Vector3.TransformCoordinates(
              //   this.firstEdges[firstTriangleMeshFlipEdgeIndex],
              //   matrix,
              // );

              // // console.log(test, this.test);

              // this.rotationAxis = Vector3.TransformCoordinates(
              //   this.rotationAxis,
              //   Matrix.Invert(matrix),
              // );

              // console.log(
              //   test,
              //   this.firstEdges[firstTriangleMeshFlipEdgeIndex],
              // );

              if (
                // direction &&
                this.adjacentTriangleMesh &&
                this.adjacentTriangleMesh.getTriangleMesh()
              ) {
                // #BONES
                const firstTriangleMeshSkeleton =
                  this.triangleMesh.getTriangleMesh()?.skeleton?.bones;
                const secondTriangleMeshSkeleton =
                  this.adjacentTriangleMesh.getTriangleMesh()?.skeleton?.bones;

                // const bones = {
                //   firstTriangle: {
                //     first: { ...firstTriangleMeshSkeleton[0].rotation },
                //     second: { ...firstTriangleMeshSkeleton[1].rotation },
                //     third: { ...firstTriangleMeshSkeleton[2].rotation },
                //   },
                //   secondTriangle: {
                //     first: { ...secondTriangleMeshSkeleton[0].rotation },
                //     second: { ...secondTriangleMeshSkeleton[1].rotation },
                //     third: { ...secondTriangleMeshSkeleton[2].rotation },
                //   },
                // };

                // firstTriangleMeshSkeleton.forEach((b, i) => {
                //   // eslint-disable-next-line no-underscore-dangle
                //   switch (i) {
                //     case 0:
                //       b.rotation.x = bones.secondTriangle.first._x;
                //       b.rotation.y = bones.secondTriangle.first._y;
                //       b.rotation.z = bones.secondTriangle.first._z;
                //       break;
                //     case 1:
                //       b.rotation.x = bones.secondTriangle.second._x;
                //       b.rotation.y = bones.secondTriangle.second._y;
                //       b.rotation.z = bones.secondTriangle.second._z;
                //       break;
                //     case 2:
                //       b.rotation.x = bones.secondTriangle.third._x;
                //       b.rotation.y = bones.secondTriangle.third._y;
                //       b.rotation.z = bones.secondTriangle.third._z;
                //       break;
                //     default:
                //   }
                // });

                const firstTriangleBonesIndices =
                  this.triangleMesh.getTriangleMeshVerticeIndices(
                    firstTriangleVerticesIndices,
                  );

                // // #SHIFT_ROTATION_NODE
                // const deltaShift =
                //   firstTriangle_AdjacentEdgeCenter_TriangleCenter.length() /
                //   secondTriangle_AdjacentEdgeCenter_TriangleCenter.length();
                // console.log(deltaShift);

                // scalingNodeFirstTriangle.position =
                //   scalingNodeFirstTriangle.position.scale(1 / deltaShift);
                const anglesRatio =
                  adjacentEdgeWorldSpaceCenterPoint
                    .subtract(this.triangleMesh.getTriangle().getCenterPoint())
                    .length() /
                  adjacentEdgeWorldSpaceCenterPoint
                    .subtract(
                      this.adjacentTriangleMesh.getTriangle().getCenterPoint(),
                    )
                    .length();

                this.rotationAxis =
                  this.firstEdges[firstTriangleMeshFlipEdgeIndex];

                this.deltaShift = this.scalingNode.position.subtract(
                  this.scalingNode.position.scale(1 / anglesRatio),
                );
              }
            }
          }
        }
      }
    }
  }

  public update(): Nullable<IMeshState> {
    const amount = Number(this.amount.toFixed(10)); // fixing computing approximation error
    const rotationSpeed = this.getRotationSpeed();

    if (amount < 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          // Vector3.TransformCoordinates(this.test, matrix),
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, amount),
        );

      // this.flipNode = this.flipNode.rotate(
      //   this.test,
      //   Scalar.LerpAngle(0, Math.abs(this.rotationAngle), rotationSpeed),
      //   Space.WORLD,
      // );

      (this.scalingNode as TransformNode).position = (
        this.scalingNode as TransformNode
      ).position.subtract(this.deltaShift.scale(rotationSpeed));
      this.amount += rotationSpeed;
      // #DEBUG rotation arc
      MeshBuilder.CreateLines('*', {
        points: [
          (this.scalingNode as TransformNode).getAbsolutePosition(),
          (this.scalingNode as TransformNode).getAbsolutePosition().scale(1.01),
        ],
      });
    } else if (amount >= 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, 0),
        );
      (this.scalingNode as TransformNode).position = (
        this.scalingNode as TransformNode
      ).position.add(this.deltaShift);
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
