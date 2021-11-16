import {
  MeshBuilder, // #debug
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  DeepImmutableObject,
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

  private rotationDownAngle: number;

  private rotationUpAngle: number;

  private flipNode: TransformNode;

  private rotationQuaternion: Quaternion;

  private rotationQuaternion2: Quaternion;

  private flipQuaternion: DeepImmutableObject<Quaternion>;

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

              this.rotationDownAngle = Math.abs(
                Vector3.GetAngleBetweenVectors(
                  firstTriangleRotationVector,
                  secondTriangleRotationVector,
                  this.firstEdges[firstTriangleMeshFlipEdgeIndex],
                ),
              );

              this.rotationUpAngle = Math.PI * 2 - this.rotationDownAngle;

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
                this.rotationQuaternion = Quaternion.RotationAxis(
                  this.rotationAxis,
                  this.rotationDownAngle,
                );

                this.rotationQuaternion2 = Quaternion.RotationAxis(
                  this.rotationAxis,
                  this.rotationUpAngle,
                );

                this.flipQuaternion = this.flipNode
                  .rotationQuaternion as DeepImmutableObject<Quaternion>;
              }
            }
          }
        }
      }
    }
  }

  public update(): Nullable<IMeshState> {
    const angleRatio = this.rotationUpAngle / this.rotationDownAngle;

    switch (this.direction) {
      case 1: {
        // const rotationAnglePerFrame = this.getRotationAnglePerFrame(
        //   this.rotationDownAngle,
        // );
        // console.log('FIRST', (this.rotationDownAngle * 180) / Math.PI);
        // console.log('ANGLE', this.angle);

        // #ROTATION_TRIANGLE1
        if (this.amount > 1) {
          this.nextState = new MeshStateIdle({
            triangleMesh: this.triangleMesh,
            scene: this.scene,
          });
        } else {
          this.flipNode.rotationQuaternion = Quaternion.Slerp(
            // Quaternion.RotationAxis(this.rotationAxis, 0),
            // Quaternion.Identity(),
            this.flipQuaternion,
            this.rotationQuaternion,
            this.amount,
          );
          this.amount += 1 / 50;
        }
        break;
      }
      case -1: {
        // console.log('SECOND', (this.rotationUpAngle * 180) / Math.PI);
        // console.log('ANGLE', this.angle);

        // #ROTATION_TRIANGLE2
        if (this.amount > angleRatio) {
          this.flipNode.rotationQuaternion = Quaternion.Slerp(
            this.flipQuaternion,
            this.rotationQuaternion2,
            angleRatio,
          );
          this.nextState = new MeshStateIdle({
            triangleMesh: this.triangleMesh,
            scene: this.scene,
          });
        } else {
          this.flipNode.rotationQuaternion = Quaternion.Slerp(
            this.flipQuaternion,
            this.rotationQuaternion,
            -this.amount,
          );
          this.amount += (1 / 50) * angleRatio;
        }
        break;
      }
      default:
    }

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
