import {
  // MeshBuilder, // #debug
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  Scalar,
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

  private rotationAxis: Vector3;

  private rotationAngle: number;

  private flipNode: Nullable<TransformNode>;

  private amount: number;

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
    this.amount = 0;
    this.firstEdges = this.triangleMesh.getEdges();
    this.firstVertices = this.triangleMesh.getVertices();
    this.rotationAngle = 0;
    this.rotationAxis = Vector3.Zero();

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

          if (this.firstEdges && this.firstVertices) {
            const firstTriangleVerticeIndices =
              Object.keys(adjacentsVerticesMap);

            const firstTriangleMeshVerticeIndices: number[] =
              this.triangleMesh.getTriangleMeshVerticeIndices(
                firstTriangleVerticeIndices,
              );

            // const secondTriangleVerticeIndices =
            //   Object.values(adjacentsVerticesMap);

            // const secondTriangleMeshVerticeIndices: number[] =
            //   this.triangleMesh.getTriangleMeshVerticeIndices(
            //     secondTriangleVerticeIndices,
            //   );

            const firstTriangleMeshIndicesSum =
              this.triangleMesh.getTriangleMeshIndicesSum(
                firstTriangleMeshVerticeIndices,
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

              // const adjecentTriangleWorldSpaceVertices =
              //   this.adjacentTriangleMesh.getTriangle().getVertices();

              const adjacentEdgeWorldSpaceCenterPoint = Vector3.Center(
                firstTriangleWorldSpaceVertices[
                  Number(firstTriangleVerticeIndices[0])
                ],
                firstTriangleWorldSpaceVertices[
                  Number(firstTriangleVerticeIndices[1])
                ],
              );

              flipNodeFirstTriangle.setAbsolutePosition(
                adjacentEdgeWorldSpaceCenterPoint,
              );
              scalingNodeFirstTriangle.position =
                flipNodeFirstTriangleCenter.subtract(
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

              // const { direction } = this;

              // // #DEBUG_ADJACENT_EDGE
              // addAxisToScene({
              //   scene: this.scene,
              //   size: 0.5,
              //   parent: scalingNodeFirstTriangle,
              // });
              // MeshBuilder.CreateLines('line1', {
              //   points: [
              //     adjacentEdgeWorldSpaceCenterPoint,
              //     this.triangleMesh.getTriangle().getCenterPoint(),
              //   ],
              // });
              // MeshBuilder.CreateLines('line2', {
              //   points: [
              //     this.triangleMesh.getTriangle().getCenterPoint(),
              //     this.adjacentTriangleMesh.getTriangle().getCenterPoint(),
              //     adjacentEdgeWorldSpaceCenterPoint,
              //     this.triangleMesh.getTriangle().getCenterPoint(),
              //   ],
              // });
              // MeshBuilder.CreateLines('line3', {
              //   points: [
              //     firstTriangleWorldSpaceVertices[
              //       Number(firstTriangleVerticeIndices[0])
              //     ],
              //     firstTriangleWorldSpaceVertices[
              //       Number(firstTriangleVerticeIndices[1])
              //     ],
              //   ],
              // });
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

                // firstTriangleMeshSkeleton?.forEach((b, i) => {
                //   let rotationBone = b.rotation;
                //   let scalingBone = b.scaling;

                //   rotationBone = secondTriangleMeshSkeleton[i].rotation;
                //   scalingBone = secondTriangleMeshSkeleton[i].scaling;
                //   b.setRotation(rotationBone);
                //   b.setScale(scalingBone);
                // });

                // // #SHIFT_ROTATION_NODE
                // const deltaShift =
                //   firstTriangle_AdjacentEdgeCenter_TriangleCenter.length() /
                //   secondTriangle_AdjacentEdgeCenter_TriangleCenter.length();
                // console.log(deltaShift);

                // scalingNodeFirstTriangle.position =
                //   scalingNodeFirstTriangle.position.scale(1 / deltaShift);

                this.rotationAxis =
                  this.firstEdges[firstTriangleMeshFlipEdgeIndex];

                // if (this.direction === 1) {
                //   this.rotationQuaternion = Quaternion.RotationAxis(
                //     this.rotationAxis,
                //     this.rotationDownAngle,
                //   );
                // } else {
                //   this.rotationQuaternion = Quaternion.RotationAxis(
                //     this.rotationAxis,
                //     this.rotationUpAngle,
                //   );
                // }
              }
            }
          }
        }
      }
    }
  }

  public update(): Nullable<IMeshState> {
    if (this.amount > 1) {
      this.nextState = new MeshStateIdle({
        triangleMesh: this.triangleMesh,
        scene: this.scene,
      });
    } else {
      this.flipNode.rotationQuaternion = Quaternion.RotationAxis(
        this.rotationAxis,
        Scalar.LerpAngle(0, this.rotationAngle, this.amount) * this.direction,
      );
      this.amount += 1 / 10;
    }
    // switch (this.direction) {
    //   case 1: {
    //     // const rotationAnglePerFrame = this.getRotationAnglePerFrame(
    //     //   this.rotationDownAngle,
    //     // );
    //     // console.log('FIRST', (this.rotationDownAngle * 180) / Math.PI);
    //     // console.log('ANGLE', this.angle);

    //     // #ROTATION_TRIANGLE1
    //     if (this.amount > 1) {
    //       this.nextState = new MeshStateIdle({
    //         triangleMesh: this.triangleMesh,
    //         scene: this.scene,
    //       });
    //     } else {
    //       this.flipNode.rotationQuaternion = Quaternion.RotationAxis(
    //         this.rotationAxis,
    //         Scalar.LerpAngle(0, this.rotationAngle, this.amount) *
    //           this.direction,
    //       );
    //       this.amount += 1 / 50;
    //     }
    //     break;
    //   }
    //   case -1: {
    //     // console.log('SECOND', (this.rotationUpAngle * 180) / Math.PI);
    //     // console.log('ANGLE', this.angle);

    //     // #ROTATION_TRIANGLE2
    //     if (this.amount > 1) {
    //       this.nextState = new MeshStateIdle({
    //         triangleMesh: this.triangleMesh,
    //         scene: this.scene,
    //       });
    //     } else {
    //       this.flipNode.rotationQuaternion = Quaternion.RotationAxis(
    //         this.rotationAxis,
    //         Scalar.LerpAngle(0, this.rotationUpAngle, this.amount) *
    //           this.direction,
    //       );
    //       this.amount += 1 / 50;
    //     }
    //     break;
    //   }
    //   default:
    // }

    return this.nextState;
  }

  public getRotationAnglePerFrame(angle: number): number {
    const deltaTimeInMillis = this.scene.getEngine().getDeltaTime();
    const rotationAnglePerFrame =
      (100 / 60) * angle * (deltaTimeInMillis / 1000);
    return rotationAnglePerFrame;
  }
}
export default MeshStateRotating;
