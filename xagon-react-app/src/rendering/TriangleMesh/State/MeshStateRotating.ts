import {
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  Scalar,
  Bone,
} from '@babylonjs/core';
import TriangleMesh from '..';
import IMeshState from './IMeshState';
import MeshStateIdle from './MeshStateIdle';

class MeshStateRotating extends IMeshState {
  private nextState: Nullable<IMeshState> = null;

  private scene: Scene;

  private mesh: TriangleMesh;

  private rotationAxis: Vector3 = Vector3.Zero();

  private rotationAngle = 0;

  private flipNode: Nullable<TransformNode> = null;

  private scalingNode: Nullable<TransformNode> = null;

  private scalingNode_FinalPosition: Vector3 = Vector3.Zero();

  private skeleton: Nullable<Bone[]> = [];

  private adjacentTriangleMesh_BonesScaleYaw: number[] = [];

  private bonesScaling: Nullable<Vector3>[] = [];

  private bonesIndices: number[] = [];

  private amount = 0;

  private onFlipEnd?: () => void;

  public constructor({
    thisTriangleMesh,
    adjacentTriangleMesh,
    scene,
    direction,
    onFlipEnd,
  }: {
    thisTriangleMesh: TriangleMesh;
    adjacentTriangleMesh: TriangleMesh;
    scene: Scene;
    direction?: number;
    onFlipEnd?: () => void;
  }) {
    super();
    this.scene = scene;
    this.onFlipEnd = onFlipEnd;
    this.mesh = thisTriangleMesh;

    const mesh = thisTriangleMesh;
    const adjacentMesh = adjacentTriangleMesh;
    const edges = mesh.getEdges();
    const vertices = mesh.getVertices();

    const adjacentsVerticesMap = mesh.getAdjacentsVerticesMap(
      adjacentMesh.getTriangle(),
    );

    if (mesh && adjacentMesh) {
      const triangleMesh = mesh.getTriangleMesh();
      const adjacentTriangleMesh_Mesh = adjacentMesh.getTriangleMesh();
      if (triangleMesh) {
        this.scalingNode = triangleMesh.parent as TransformNode;

        if (this.scalingNode) {
          const flipNode = this.scalingNode.parent as TransformNode;

          if (edges && vertices) {
            const adjacentsVerticesIndices = Object.keys(
              adjacentsVerticesMap,
            ).map((i) => Number(i));

            const adjacentTriangleMesh_AdjacentsVerticesIndices =
              Object.values(adjacentsVerticesMap);

            const adjacentsVerticesIndicesSum = mesh.getTriangleMeshIndicesSum(
              adjacentsVerticesIndices,
            );

            const adjacentEdgeIndex = mesh.getTriangleMeshFlipEdgeIndex(
              adjacentsVerticesIndicesSum,
            );

            if (flipNode) {
              const flipNodeCenter = Vector3.Zero(); // node position in object space
              const adjacentEdgeCenterPoint = Vector3.Center(
                vertices[adjacentsVerticesIndices[0]],
                vertices[adjacentsVerticesIndices[1]],
              );

              flipNode.setPositionWithLocalVector(adjacentEdgeCenterPoint);
              this.scalingNode.position = flipNodeCenter.subtract(
                flipNode.position,
              );
              this.flipNode = flipNode;

              const worldSpace_Vertices = mesh.getTriangle().getVertices();

              const worldSpace_AdjacentEdge = worldSpace_Vertices[
                adjacentsVerticesIndices[0]
              ].subtract(worldSpace_Vertices[adjacentsVerticesIndices[1]]);

              const worldSpace_AdjacentEdgeCenterPoint = Vector3.Center(
                worldSpace_Vertices[adjacentsVerticesIndices[0]],
                worldSpace_Vertices[adjacentsVerticesIndices[1]],
              );

              const rotationVector = mesh
                .getTriangle()
                .getCenterPoint()
                .subtract(worldSpace_AdjacentEdgeCenterPoint);
              const adjacentTriangleMesh_RotationVector = adjacentMesh
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

              if (adjacentMesh && adjacentMesh.getTriangleMesh()) {
                // computing length ratio between vector (edge's center - mesh's center) of the first triangle and vector (edge's center - mesh's center) of the second triangle to shift the scaling node during rotation
                const scalingNode_ShiftRatio =
                  rotationVector.length() /
                  adjacentTriangleMesh_RotationVector.length();

                this.scalingNode_FinalPosition =
                  this.scalingNode.position.scale(1 / scalingNode_ShiftRatio);

                this.rotationAxis = edges[adjacentEdgeIndex];

                const notAdjacentVertexIndex = vertices.findIndex(
                  (v) =>
                    v !== (vertices && vertices[adjacentsVerticesIndices[0]]) &&
                    v !== (vertices && vertices[adjacentsVerticesIndices[1]]),
                );

                const adjacentBonesIndices = mesh.getTriangleMeshBonesIndices(
                  adjacentsVerticesIndices,
                );
                const notAdjacentBoneIndex = mesh.getTriangleMeshBonesIndices([
                  notAdjacentVertexIndex,
                ]);

                const adjacentTriangleMesh_adjacentBonesIndices =
                  adjacentMesh.getTriangleMeshBonesIndices(
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
                  triangleMesh &&
                  triangleMesh.skeleton &&
                  triangleMesh.skeleton.bones;

                const adjacentTriangleMesh_Skeleton =
                  adjacentTriangleMesh_Mesh &&
                  adjacentTriangleMesh_Mesh.skeleton &&
                  adjacentTriangleMesh_Mesh.skeleton.bones;

                const firstAdjacentBoneScaling =
                  this.skeleton &&
                  this.skeleton[adjacentBonesIndices[0]].scaling;
                const secondAdjacentBoneScaling =
                  this.skeleton &&
                  this.skeleton[adjacentBonesIndices[1]].scaling;
                const notAdjacentBoneScaling =
                  this.skeleton &&
                  this.skeleton[notAdjacentBoneIndex[0]].scaling;

                const bonesScaling = [
                  firstAdjacentBoneScaling,
                  secondAdjacentBoneScaling,
                  notAdjacentBoneScaling,
                ];
                this.bonesScaling = bonesScaling.map(
                  (boneScaling) =>
                    boneScaling &&
                    new Vector3(boneScaling.x, boneScaling.y, boneScaling.z),
                );

                if (adjacentTriangleMesh_Skeleton) {
                  this.adjacentTriangleMesh_BonesScaleYaw = [
                    adjacentTriangleMesh_Skeleton[
                      adjacentTriangleMesh_adjacentBonesIndices[0]
                    ].scaling.y,
                    adjacentTriangleMesh_Skeleton[
                      adjacentTriangleMesh_adjacentBonesIndices[1]
                    ].scaling.y,
                    adjacentTriangleMesh_Skeleton[
                      adjacentTriangleMesh_NotAdjacentBoneIndex
                    ].scaling.y,
                  ];
                }
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
    const skeleton = this.skeleton as Bone[];
    const bonesScaling = this.bonesScaling as Vector3[];

    if (this.amount < 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, this.amount),
        );

      if (skeleton && bonesScaling && this.adjacentTriangleMesh_BonesScaleYaw) {
        const bonesScaleYaw = bonesScaling.map(
          (boneScaling, i) =>
            boneScaling &&
            Scalar.Lerp(
              boneScaling.y,
              this.adjacentTriangleMesh_BonesScaleYaw[i],
              this.amount,
            ),
        );

        this.bonesIndices.forEach((boneIndex, i) => {
          skeleton[boneIndex].setScale(
            new Vector3(
              skeleton[boneIndex].scaling.x,
              bonesScaleYaw[i],
              skeleton[boneIndex].scaling.z,
            ),
          );
        });
      }

      scalingNode.position = Vector3.Lerp(
        scalingNode.position,
        this.scalingNode_FinalPosition,
        this.amount,
      );

      this.amount += rotationSpeed;
    } else if (this.amount >= 1) {
      this.nextState = new MeshStateIdle({
        triangleMesh: this.mesh,
        scene: this.scene,
      });

      if (this.onFlipEnd) {
        this.onFlipEnd();
      }
    }

    return this.nextState;
  }

  public getRotationSpeed(): number {
    const deltaTimeInMillis = this.scene.getEngine().getDeltaTime();
    const rotationSpeed = (6 * deltaTimeInMillis) / 1000;
    return rotationSpeed;
  }
}
export default MeshStateRotating;
