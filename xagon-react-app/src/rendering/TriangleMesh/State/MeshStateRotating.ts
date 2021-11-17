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

              // const adjacentTriangleWorldSpaceVertices =
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
                    Number(firstTriangleVerticeIndices[0])
                  ],
                  firstTriangleWorldSpaceVertices[
                    Number(firstTriangleVerticeIndices[1])
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
                const ratio =
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
                  this.scalingNode.position.scale(1 / ratio),
                );
                console.log(this.rotationAxis);

                // this.testAxis = firstTriangleWorldSpaceVertices[
                //   Number(firstTriangleVerticeIndices[0])
                // ].subtract(
                //   firstTriangleWorldSpaceVertices[
                //     Number(firstTriangleVerticeIndices[1])
                //   ],
                // );
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
    // this.flipNode.rotationQuaternion = Quaternion.RotationAxis(
    //   this.rotationAxis,
    //   this.rotationAngle,
    // );
    // this.scalingNode.position = this.scalingNode.position.add(this.deltaShift);
    // this.nextState = new MeshStateIdle({
    //   triangleMesh: this.triangleMesh,
    //   scene: this.scene,
    // });
    if (amount < 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, amount),
        );

      this.scalingNode.position = this.scalingNode.position.subtract(
        this.deltaShift.scale(rotationSpeed),
      );
      this.amount += rotationSpeed;
      // #DEBUG rotation arc
      MeshBuilder.CreateLines('*', {
        points: [
          this.scalingNode.getAbsolutePosition(),
          this.scalingNode.getAbsolutePosition().scale(1.01),
        ],
      });
    } else if (amount >= 1) {
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
