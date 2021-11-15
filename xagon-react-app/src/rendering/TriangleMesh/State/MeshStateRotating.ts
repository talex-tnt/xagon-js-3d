import {
  MeshBuilder,
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { addAxisToScene } from 'utils';
import TriangleMesh from '..';
import IMeshState from './IMeshState';
import MeshStateIdle from './MeshStateIdle';

class MeshStateRotating extends IMeshState {
  private nextState: Nullable<IMeshState> = null;

  private triangleMesh: TriangleMesh;

  private adjacentTriangleMesh: TriangleMesh;

  private scene: Scene;

  private direction: number | undefined;

  private angle: number;

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
    this.angle = 0;
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

              const adjecentTriangleWorldSpaceVertices =
                this.adjacentTriangleMesh.getTriangle().getVertices();

              console.log(
                'firstTriangleWorldSpaceVertices',
                firstTriangleWorldSpaceVertices,
              );
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

              const firstTriangleRotationVector = this.triangleMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(adjacentEdgeWorldSpaceCenterPoint);

              const secondTriangleRotationVector = this.adjacentTriangleMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(adjacentEdgeWorldSpaceCenterPoint);

              // const rotationSpeed = this.getRotationSpeed();
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
              //     adjacentEdgeWorldSpaceCenterPoint,
              //     this.adjacentTriangleMesh.getTriangle().getCenterPoint(),
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

              const rotationPlaneNormal = Vector3.Cross(
                firstTriangleRotationVector,
                secondTriangleRotationVector,
              );

              const rotationAngle = Vector3.GetAngleBetweenVectors(
                firstTriangleRotationVector,
                secondTriangleRotationVector,
                rotationPlaneNormal,
              );

              if (
                // direction &&
                this.adjacentTriangleMesh &&
                this.adjacentTriangleMesh.getTriangleMesh()
              ) {
                // this.angle += rotationSpeed;

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

                const rotationAxis = firstEdges[firstTriangleMeshFlipEdgeIndex];

                flipNodeFirstTriangle.rotationQuaternion =
                  Quaternion.RotationAxis(rotationAxis, rotationAngle);

                this.nextState = new MeshStateIdle({
                  triangleMesh: this.triangleMesh,
                  scene: this.scene,
                });

                // switch (direction) {
                //   case 1: {
                //     flipNodeFirstTriangle.rotationQuaternion =
                //       Quaternion.RotationAxis(
                //         firstEdges[firstTriangleMeshFlipEdgeIndex],
                //         firstTriangleFlipAngle,
                //       );
                //     this.nextState = new MeshStateIdle({
                //       triangleMesh: this.triangleMesh,
                //       scene: this.scene,
                //     });

                //     // #ROTATION_TRIANGLE1
                //     // if (this.angle >= Math.abs(firstTriangleFlipAngle)) {
                //     //   this.nextState = new MeshStateIdle({
                //     //     triangleMesh: this.triangleMesh,
                //     //     scene: this.scene,
                //     //   });
                //     // } else {
                //     //   flipNodeFirstTriangle.rotationQuaternion =
                //     //     Quaternion.RotationAxis(
                //     //       firstEdges[firstTriangleMeshFlipEdgeIndex],
                //     //       this.angle * direction,
                //     //     );
                //     // }
                //     break;
                //   }
                //   case -1: {
                //     flipNodeFirstTriangle.rotationQuaternion =
                //       Quaternion.RotationAxis(
                //         firstEdges[firstTriangleMeshFlipEdgeIndex],
                //         secondTriangleFlipAngle * direction,
                //       );
                //     this.nextState = new MeshStateIdle({
                //       triangleMesh: this.triangleMesh,
                //       scene: this.scene,
                //     });
                //     // #ROTATION_TRIANGLE2
                //     // if (this.angle >= Math.abs(firstTriangleFlipAngle)) {
                //     //   this.nextState = new MeshStateIdle({
                //     //     triangleMesh: this.triangleMesh,
                //     //     scene: this.scene,
                //     //   });
                //     // } else {
                //     //   flipNodeFirstTriangle.rotationQuaternion =
                //     //     Quaternion.RotationAxis(
                //     //       firstEdges[firstTriangleMeshFlipEdgeIndex],
                //     //       this.angle *
                //     //         direction *
                //     //         (secondTriangleFlipAngle / firstTriangleFlipAngle),
                //     //     );
                //     // }
                //     break;
                //   }
                //   default:
                // }
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
    const rotationSpeed = (5 / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    return rotationSpeed;
  }
}
export default MeshStateRotating;
