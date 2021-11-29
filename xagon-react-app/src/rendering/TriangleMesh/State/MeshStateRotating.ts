import {
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  Scalar,
  StandardMaterial,
  AbstractMesh,
  Bone,
} from '@babylonjs/core';
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

  private finalScalingNodePosition: Vector3 = Vector3.Zero();

  private shiftRatio = 1;

  private firstTriangleSkeleton: Bone[] = [];

  private secondTriangleSkeleton: Bone[] = [];

  private adjacentFirstBoneScaleYaw = 1;

  private adjacentSecondBoneScaleYaw = 1;

  private notAdjacentSecondTriangleBoneScaleYaw = 1;

  private originalFirstBoneScaling: Vector3 = Vector3.One();

  private originalSecondBoneScaling: Vector3 = Vector3.One();

  private originalNotAdjacentBoneScaling: Vector3 = Vector3.One();

  private bonesIndices: number[] = [];

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
            const firstTriangleMeshVerticesIndicesKeys =
              Object.keys(adjacentsVerticesMap);
            const firstTriangleMeshVerticesIndices = [
              Number(firstTriangleMeshVerticesIndicesKeys[0]),
              Number(firstTriangleMeshVerticesIndicesKeys[1]),
            ];
            const secondTriangleMeshVerticesIndices =
              Object.values(adjacentsVerticesMap);

            // const secondTriangleMeshVerticesIndices: number[] =
            //   this.triangleMesh.getTriangleMeshVerticeIndices(
            //     secondTriangleVerticesIndices,
            //   );

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
              const adjacentEdgeCenterPoint = Vector3.Center(
                this.firstVertices[firstTriangleMeshVerticesIndices[0]],
                this.firstVertices[firstTriangleMeshVerticesIndices[1]],
              );

              flipNodeFirstTriangle.setPositionWithLocalVector(
                adjacentEdgeCenterPoint,
              );
              this.scalingNode.position = flipNodeFirstTriangleCenter.subtract(
                flipNodeFirstTriangle.position,
              );
              this.flipNode = flipNodeFirstTriangle;

              const firstTriangleWorldSpaceVertices = this.triangleMesh
                .getTriangle()
                .getVertices();

              const adjacentEdgeWorldSpace = firstTriangleWorldSpaceVertices[
                firstTriangleMeshVerticesIndices[0]
              ].subtract(
                firstTriangleWorldSpaceVertices[
                  firstTriangleMeshVerticesIndices[1]
                ],
              );

              const adjacentEdgeWorldSpaceCenterPoint = Vector3.Center(
                firstTriangleWorldSpaceVertices[
                  firstTriangleMeshVerticesIndices[0]
                ],
                firstTriangleWorldSpaceVertices[
                  firstTriangleMeshVerticesIndices[1]
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
                this.adjacentTriangleMesh &&
                this.adjacentTriangleMesh.getTriangleMesh()
              ) {
                // computing length ratio between vector (edge's center - mesh's center) of the first triangle and vector (edge's center - mesh's center) of the second triangle to shift the node during rotation
                this.shiftRatio =
                  firstTriangleRotationVector.length() /
                  secondTriangleRotationVector.length();

                this.finalScalingNodePosition = this.scalingNode.position.scale(
                  1 / this.shiftRatio,
                );

                this.rotationAxis =
                  this.firstEdges[firstTriangleMeshFlipEdgeIndex];

                const firstTriangleMeshNotAdjacentVerticeIndex =
                  this.firstVertices.findIndex(
                    (v) =>
                      v !==
                        this.firstVertices[
                          firstTriangleMeshVerticesIndices[0]
                        ] &&
                      v !==
                        this.firstVertices[firstTriangleMeshVerticesIndices[1]],
                  );

                const adjacentBonesIndices =
                  this.triangleMesh.getTriangleMeshBonesIndices(
                    firstTriangleMeshVerticesIndices,
                  );

                const adjacentBonesIndicesSecondTriangle =
                  this.adjacentTriangleMesh.getTriangleMeshBonesIndices(
                    secondTriangleMeshVerticesIndices,
                  );

                const notAdjacentBoneIndex =
                  this.triangleMesh.getTriangleMeshBonesIndices([
                    firstTriangleMeshNotAdjacentVerticeIndex,
                  ]);
                const secondNotAdjacentBoneIndex = [0, 1, 2].findIndex(
                  (e) =>
                    e !== adjacentBonesIndicesSecondTriangle[0] &&
                    e !== adjacentBonesIndicesSecondTriangle[1],
                );

                this.bonesIndices = [
                  ...adjacentBonesIndices,
                  ...notAdjacentBoneIndex,
                ];

                // let bonesIndicesFirst = [];
                // let bonesIndicesSecond = [];

                // if (notAdjacentBoneIndex[0] === 0) {
                //   bonesIndicesFirst = [1, 2];
                //   if (secondNotAdjacentBoneIndex === 0) {
                //     bonesIndicesSecond = [2, 1];
                //   } else if (secondNotAdjacentBoneIndex === 1) {
                //     bonesIndicesSecond = [0, 2];
                //   } else {
                //     bonesIndicesSecond = [1, 0];
                //   }
                // } else if (notAdjacentBoneIndex[0] === 1) {
                //   bonesIndicesFirst = [2, 0];
                //   if (secondNotAdjacentBoneIndex === 0) {
                //     bonesIndicesSecond = [2, 1];
                //   } else if (secondNotAdjacentBoneIndex === 1) {
                //     bonesIndicesSecond = [0, 2];
                //   } else {
                //     bonesIndicesSecond = [1, 0];
                //   }
                // } else {
                //   bonesIndicesFirst = [0, 1];
                //   if (secondNotAdjacentBoneIndex === 0) {
                //     bonesIndicesSecond = [2, 1];
                //   } else if (secondNotAdjacentBoneIndex === 1) {
                //     bonesIndicesSecond = [0, 2];
                //   } else {
                //     bonesIndicesSecond = [1, 0];
                //   }
                // }

                // console.log(bonesIndicesFirst, bonesIndicesSecond);

                this.firstTriangleSkeleton =
                  this.triangleMesh.getTriangleMesh().skeleton.bones;

                this.secondTriangleSkeleton =
                  this.adjacentTriangleMesh.getTriangleMesh().skeleton.bones;

                // ROTATION-BONES
                // const originalMesh = this.scene.getMeshByName('TriangleMesh');
                // const originalSkeleton = originalMesh.skeleton.bones;

                // const originalThisFirstBoneRotation =
                //   originalSkeleton[adjacentBonesIndices[0]].rotation.y;
                // const thisFirstBoneRotation =
                //   this.firstTriangleSkeleton[adjacentBonesIndices[0]].rotation
                //     .y;

                // const originalAdjacentFirstBoneRotation =
                //   originalSkeleton[adjacentBonesIndicesSecondTriangle[0]]
                //     .rotation.y;
                // const adjacentFirstBoneRotation =
                //   this.secondTriangleSkeleton[
                //     adjacentBonesIndicesSecondTriangle[0]
                //   ].rotation.y;

                // const originalThisSecondBoneRotation =
                //   originalSkeleton[adjacentBonesIndices[1]].rotation.y;
                // const thisSecondBoneRotation =
                //   this.firstTriangleSkeleton[adjacentBonesIndices[1]].rotation
                //     .y;

                // const originalAdjacentSecondBoneRotation =
                //   originalSkeleton[adjacentBonesIndicesSecondTriangle[1]]
                //     .rotation.y;
                // const adjacentSecondBoneRotation =
                //   this.secondTriangleSkeleton[
                //     adjacentBonesIndicesSecondTriangle[1]
                //   ].rotation.y;

                // console.log(
                //   originalAdjacentFirstBoneRotation,
                //   adjacentFirstBoneRotation,
                // );

                // console.log(
                //   'DELTA ANGLE FIRST-BONE in FIRST-TRIANGLE',
                //   originalThisFirstBoneRotation - thisFirstBoneRotation,
                // );
                // console.log(
                //   'DELTA ANGLE SECOND-BONE in FIRST-TRIANGLE',
                //   originalThisSecondBoneRotation - thisSecondBoneRotation,
                // );
                // console.log(
                //   'DELTA ANGLE FIRST-BONE in SECOND-TRIANGLE',
                //   originalAdjacentFirstBoneRotation - adjacentFirstBoneRotation,
                // );
                // console.log(
                //   'DELTA ANGLE SECOND-BONE in SECOND-TRIANGLE',
                //   originalAdjacentSecondBoneRotation -
                //     adjacentSecondBoneRotation,
                // );

                // this.firstBoneRotationAngle =
                //   originalThisFirstBoneRotation -
                //   thisFirstBoneRotation +
                //   (originalAdjacentFirstBoneRotation -
                //     adjacentFirstBoneRotation);

                // this.secondBoneRotationAngle =
                //   originalThisSecondBoneRotation -
                //   thisSecondBoneRotation +
                //   (originalAdjacentSecondBoneRotation -
                //     adjacentSecondBoneRotation);

                const firstBoneScaling =
                  this.firstTriangleSkeleton[adjacentBonesIndices[0]].scaling;
                const secondBoneScaling =
                  this.firstTriangleSkeleton[adjacentBonesIndices[1]].scaling;
                const notAdjacentBoneScaling =
                  this.firstTriangleSkeleton[notAdjacentBoneIndex[0]].scaling;

                this.originalFirstBoneScaling = new Vector3(
                  firstBoneScaling.x,
                  firstBoneScaling.y,
                  firstBoneScaling.z,
                );
                this.originalSecondBoneScaling = new Vector3(
                  secondBoneScaling.x,
                  secondBoneScaling.y,
                  secondBoneScaling.z,
                );
                this.originalNotAdjacentBoneScaling = new Vector3(
                  notAdjacentBoneScaling.x,
                  notAdjacentBoneScaling.y,
                  notAdjacentBoneScaling.z,
                );

                this.adjacentFirstBoneScaleYaw =
                  this.secondTriangleSkeleton[
                    adjacentBonesIndicesSecondTriangle[0]
                  ].scaling.y;
                this.adjacentSecondBoneScaleYaw =
                  this.secondTriangleSkeleton[
                    adjacentBonesIndicesSecondTriangle[1]
                  ].scaling.y;
                this.notAdjacentSecondTriangleBoneScaleYaw =
                  this.secondTriangleSkeleton[
                    secondNotAdjacentBoneIndex
                  ].scaling.y;
              }
            }
          }
        }
      }
    }
  }

  public update(): Nullable<IMeshState> {
    const rotationSpeed = this.getRotationSpeed();
    const scalingNode = this.scalingNode as TransformNode;

    if (this.amount < 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, this.amount),
        );
      const scale1 = Scalar.Lerp(
        this.firstTriangleSkeleton[this.bonesIndices[0]].scaling.y,
        this.adjacentFirstBoneScaleYaw,
        this.amount,
      );
      const scale2 = Scalar.Lerp(
        this.firstTriangleSkeleton[this.bonesIndices[1]].scaling.y,
        this.adjacentSecondBoneScaleYaw,
        this.amount,
      );
      const scale3 = Scalar.Lerp(
        this.firstTriangleSkeleton[this.bonesIndices[2]].scaling.y,
        this.notAdjacentSecondTriangleBoneScaleYaw,
        this.amount,
      );

      this.firstTriangleSkeleton[this.bonesIndices[0]].setScale(
        new Vector3(
          this.firstTriangleSkeleton[this.bonesIndices[0]].scaling.x,
          scale1,
          this.firstTriangleSkeleton[this.bonesIndices[0]].scaling.z,
        ),
      );
      this.firstTriangleSkeleton[this.bonesIndices[1]].setScale(
        new Vector3(
          this.firstTriangleSkeleton[this.bonesIndices[1]].scaling.x,
          scale2,
          this.firstTriangleSkeleton[this.bonesIndices[1]].scaling.z,
        ),
      );
      this.firstTriangleSkeleton[this.bonesIndices[2]].setScale(
        new Vector3(
          this.firstTriangleSkeleton[this.bonesIndices[2]].scaling.x,
          scale3,
          this.firstTriangleSkeleton[this.bonesIndices[2]].scaling.z,
        ),
      );

      scalingNode.position = Vector3.Lerp(
        scalingNode.position,
        this.finalScalingNodePosition,
        this.amount,
      );

      this.amount += rotationSpeed;
    } else if (this.amount >= 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, 0),
        );

      // set original position
      scalingNode.position = scalingNode.position.scale(this.shiftRatio);

      this.firstTriangleSkeleton[this.bonesIndices[0]].setScale(
        this.originalFirstBoneScaling,
      );
      this.firstTriangleSkeleton[this.bonesIndices[1]].setScale(
        this.originalSecondBoneScaling,
      );
      this.firstTriangleSkeleton[this.bonesIndices[2]].setScale(
        this.originalNotAdjacentBoneScaling,
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
      // const adjacentBone1Rotation =
      //   this.firstTriangleSkeleton[this.bonesIndices[0]].rotation;
      // const adjacentBone2Rotation =
      //   this.firstTriangleSkeleton[this.bonesIndices[1]].rotation;
      // const notAdjacentBoneRotation =
      //   this.firstTriangleSkeleton[this.bonesIndices[2]].rotation;

      // adjacentBone1Rotation.y += this.firstBoneRotationAngle;
      // adjacentBone2Rotation.y += this.secondBoneRotationAngle;

      // this.firstTriangleSkeleton[this.bonesIndices[0]].setRotation(
      //   adjacentBone1Rotation,
      // );
      // this.firstTriangleSkeleton[this.bonesIndices[1]].setRotation(
      //   adjacentBone2Rotation,
      // );

      this.nextState = new MeshStateIdle({
        triangleMesh: this.triangleMesh,
        scene: this.scene,
      });
    }

    return this.nextState;
  }

  public getRotationSpeed(): number {
    const deltaTimeInMillis = this.scene.getEngine().getDeltaTime();
    const rotationSpeed = (4 * deltaTimeInMillis) / 1000;
    return rotationSpeed;
  }
}
export default MeshStateRotating;
