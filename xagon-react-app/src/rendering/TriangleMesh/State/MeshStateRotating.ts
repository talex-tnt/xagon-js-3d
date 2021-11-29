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

  private scene: Scene;

  private triangleMesh: TriangleMesh;

  private adjacentTriangleMesh: TriangleMesh;

  private edges: Nullable<Vector3[]>;

  private vertices: Nullable<Vector3[]>;

  private rotationAxis: Vector3 = Vector3.Zero();

  private rotationAngle = 0;

  private flipNode: Nullable<TransformNode> = null;

  private scalingNode: Nullable<TransformNode> = null;

  private scalingNode_FinalPosition: Vector3 = Vector3.Zero();

  private scalingNode_ShiftRatio = 1;

  private skeleton: Bone[] = [];

  private adjacentTriangleMesh_Skeleton: Bone[] = [];

  private adjacentTriangleMesh_FirstAdjacentBoneScaleYaw = 1;

  private adjacentTriangleMesh_SecondBoneScaleYaw = 1;

  private adjacentTriangleMesh_NotAdjacentBoneScaleYaw = 1;

  private firstAdjacentBoneScaling: Vector3 = Vector3.One();

  private secondAdjacentBoneScaling: Vector3 = Vector3.One();

  private notAdjacentBoneScaling: Vector3 = Vector3.One();

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
    this.edges = this.triangleMesh.getEdges();
    this.vertices = this.triangleMesh.getVertices();

    const adjacentsVerticesMap = this.triangleMesh.getAdjacentsVerticesMap(
      this.adjacentTriangleMesh.getTriangle(),
    );

    if (this.triangleMesh && this.adjacentTriangleMesh) {
      const triangleMesh = this.triangleMesh.getTriangleMesh();
      if (triangleMesh) {
        this.scalingNode = triangleMesh.parent as TransformNode;

        if (this.scalingNode) {
          const flipNode = this.scalingNode.parent as TransformNode;

          if (this.edges && this.vertices) {
            const adjacentsVerticesIndices = Object.keys(
              adjacentsVerticesMap,
            ).map((i) => Number(i));

            const adjacentTriangleMesh_AdjacentsVerticesIndices =
              Object.values(adjacentsVerticesMap);

            // const secondTriangleMeshVerticesIndices: number[] =
            //   this.triangleMesh.getTriangleMeshVerticeIndices(
            //     secondTriangleVerticesIndices,
            //   );

            const adjacentsVerticesIndicesSum =
              this.triangleMesh.getTriangleMeshIndicesSum(
                adjacentsVerticesIndices,
              );

            const adjacentEdgeIndex =
              this.triangleMesh.getTriangleMeshFlipEdgeIndex(
                adjacentsVerticesIndicesSum,
              );

            if (flipNode) {
              const flipNodeCenter = Vector3.Zero(); // node position in object space
              const adjacentEdgeCenterPoint = Vector3.Center(
                this.vertices[adjacentsVerticesIndices[0]],
                this.vertices[adjacentsVerticesIndices[1]],
              );

              flipNode.setPositionWithLocalVector(adjacentEdgeCenterPoint);
              this.scalingNode.position = flipNodeCenter.subtract(
                flipNode.position,
              );
              this.flipNode = flipNode;

              const worldSpace_Vertices = this.triangleMesh
                .getTriangle()
                .getVertices();

              const worldSpace_AdjacentEdge = worldSpace_Vertices[
                adjacentsVerticesIndices[0]
              ].subtract(worldSpace_Vertices[adjacentsVerticesIndices[1]]);

              const worldSpace_AdjacentEdgeCenterPoint = Vector3.Center(
                worldSpace_Vertices[adjacentsVerticesIndices[0]],
                worldSpace_Vertices[adjacentsVerticesIndices[1]],
              );

              const rotationVector = this.triangleMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(worldSpace_AdjacentEdgeCenterPoint);
              const adjacentTriangleMesh_RotationVector =
                this.adjacentTriangleMesh
                  .getTriangle()
                  .getCenterPoint()
                  .subtract(worldSpace_AdjacentEdgeCenterPoint);

              const rotationDownAngle = Math.abs(
                Vector3.GetAngleBetweenVectors(
                  rotationVector,
                  adjacentTriangleMesh_RotationVector,
                  worldSpace_AdjacentEdge,
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
                this.scalingNode_ShiftRatio =
                  rotationVector.length() /
                  adjacentTriangleMesh_RotationVector.length();

                this.scalingNode_FinalPosition =
                  this.scalingNode.position.scale(
                    1 / this.scalingNode_ShiftRatio,
                  );

                this.rotationAxis = this.edges[adjacentEdgeIndex];

                const notAdjacentVertexIndex = this.vertices.findIndex(
                  (v) =>
                    v !== this.vertices[adjacentsVerticesIndices[0]] &&
                    v !== this.vertices[adjacentsVerticesIndices[1]],
                );

                const adjacentBonesIndices =
                  this.triangleMesh.getTriangleMeshBonesIndices(
                    adjacentsVerticesIndices,
                  );

                const notAdjacentBoneIndex =
                  this.triangleMesh.getTriangleMeshBonesIndices([
                    notAdjacentVertexIndex,
                  ]);

                const adjacentTriangleMesh_adjacentBonesIndices =
                  this.adjacentTriangleMesh.getTriangleMeshBonesIndices(
                    adjacentTriangleMesh_AdjacentsVerticesIndices,
                  );

                const adjacentTriangleMesh_NotAdjacentBoneIndex = [
                  0, 1, 2,
                ].findIndex(
                  (e) =>
                    e !== adjacentTriangleMesh_adjacentBonesIndices[0] &&
                    e !== adjacentTriangleMesh_adjacentBonesIndices[1],
                );

                this.bonesIndices = [
                  ...adjacentBonesIndices,
                  ...notAdjacentBoneIndex,
                ];

                this.skeleton =
                  this.triangleMesh.getTriangleMesh().skeleton.bones;

                this.adjacentTriangleMesh_Skeleton =
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

                const firstAdjacentBoneScaling =
                  this.skeleton[adjacentBonesIndices[0]].scaling;
                const secondAdjacentBoneScaling =
                  this.skeleton[adjacentBonesIndices[1]].scaling;
                const notAdjacentBoneScaling =
                  this.skeleton[notAdjacentBoneIndex[0]].scaling;

                this.firstAdjacentBoneScaling = new Vector3(
                  firstAdjacentBoneScaling.x,
                  firstAdjacentBoneScaling.y,
                  firstAdjacentBoneScaling.z,
                );
                this.secondAdjacentBoneScaling = new Vector3(
                  secondAdjacentBoneScaling.x,
                  secondAdjacentBoneScaling.y,
                  secondAdjacentBoneScaling.z,
                );
                this.notAdjacentBoneScaling = new Vector3(
                  notAdjacentBoneScaling.x,
                  notAdjacentBoneScaling.y,
                  notAdjacentBoneScaling.z,
                );

                this.adjacentTriangleMesh_FirstAdjacentBoneScaleYaw =
                  this.adjacentTriangleMesh_Skeleton[
                    adjacentTriangleMesh_adjacentBonesIndices[0]
                  ].scaling.y;
                this.adjacentTriangleMesh_SecondBoneScaleYaw =
                  this.adjacentTriangleMesh_Skeleton[
                    adjacentTriangleMesh_adjacentBonesIndices[1]
                  ].scaling.y;
                this.adjacentTriangleMesh_NotAdjacentBoneScaleYaw =
                  this.adjacentTriangleMesh_Skeleton[
                    adjacentTriangleMesh_NotAdjacentBoneIndex
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
      const firstAdjacentBone_ScaleYaw = Scalar.Lerp(
        this.firstAdjacentBoneScaling.y,
        this.adjacentTriangleMesh_FirstAdjacentBoneScaleYaw,
        this.amount,
      );
      const secondAdjacentBone_ScaleYaw = Scalar.Lerp(
        this.secondAdjacentBoneScaling.y,
        this.adjacentTriangleMesh_SecondBoneScaleYaw,
        this.amount,
      );
      const notAdjacentBone_ScaleYaw = Scalar.Lerp(
        this.notAdjacentBoneScaling.y,
        this.adjacentTriangleMesh_NotAdjacentBoneScaleYaw,
        this.amount,
      );

      this.skeleton[this.bonesIndices[0]].setScale(
        new Vector3(
          this.skeleton[this.bonesIndices[0]].scaling.x,
          firstAdjacentBone_ScaleYaw,
          this.skeleton[this.bonesIndices[0]].scaling.z,
        ),
      );
      this.skeleton[this.bonesIndices[1]].setScale(
        new Vector3(
          this.skeleton[this.bonesIndices[1]].scaling.x,
          secondAdjacentBone_ScaleYaw,
          this.skeleton[this.bonesIndices[1]].scaling.z,
        ),
      );
      this.skeleton[this.bonesIndices[2]].setScale(
        new Vector3(
          this.skeleton[this.bonesIndices[2]].scaling.x,
          notAdjacentBone_ScaleYaw,
          this.skeleton[this.bonesIndices[2]].scaling.z,
        ),
      );

      scalingNode.position = Vector3.Lerp(
        scalingNode.position,
        this.scalingNode_FinalPosition,
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
      scalingNode.position = scalingNode.position.scale(
        this.scalingNode_ShiftRatio,
      );

      this.skeleton[this.bonesIndices[0]].setScale(
        this.firstAdjacentBoneScaling,
      );
      this.skeleton[this.bonesIndices[1]].setScale(
        this.secondAdjacentBoneScaling,
      );
      this.skeleton[this.bonesIndices[2]].setScale(this.notAdjacentBoneScaling);

      const triangle = this.triangleMesh.getTriangle();
      const triangleMesh = this.triangleMesh.getTriangleMesh() as AbstractMesh;

      const material = this.scene.getMaterialByName(
        `meshMaterial${triangle.getId()}`,
      ) as StandardMaterial;
      material.diffuseColor = this.adjacentTriangleMesh
        .getTriangle()
        .getColor();
      triangleMesh.material = material;
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
    const rotationSpeed = (4 * deltaTimeInMillis) / 10000;
    return rotationSpeed;
  }
}
export default MeshStateRotating;
