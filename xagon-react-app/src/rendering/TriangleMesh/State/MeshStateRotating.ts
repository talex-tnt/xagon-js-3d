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

  private scalingNodeOrigPos: Vector3 = Vector3.Zero();

  private scalingNodeFinPos: Vector3 = Vector3.Zero();

  private skeleton: Nullable<Bone[]> = [];

  private adjTriangleMeshBonesScaleY: number[] = [];

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
      const adjTriangleMesh = adjacentMesh.getTriangleMesh();
      if (triangleMesh) {
        this.scalingNode = triangleMesh.parent as TransformNode;

        if (this.scalingNode) {
          const flipNode = this.scalingNode.parent as TransformNode;

          if (edges && vertices) {
            const adjVertIndices = Object.keys(adjacentsVerticesMap).map((i) =>
              Number(i),
            );

            const adjTriangleMeshAdjVertIndices =
              Object.values(adjacentsVerticesMap);

            const adjVertIndicesSum =
              mesh.getTriangleMeshIndicesSum(adjVertIndices);

            const adjEdgeIndex =
              mesh.getTriangleMeshFlipEdgeIndex(adjVertIndicesSum);

            if (flipNode) {
              const flipNodeCenter = Vector3.Zero(); // node position in object space
              const adjEdgeCenterPoint = Vector3.Center(
                vertices[adjVertIndices[0]],
                vertices[adjVertIndices[1]],
              );

              flipNode.setPositionWithLocalVector(adjEdgeCenterPoint);
              this.scalingNode.position = flipNodeCenter.subtract(
                flipNode.position,
              );
              this.flipNode = flipNode;

              const worldSpaceVertices = mesh.getTriangle().getVertices();

              const worldSpaceAdjEdge = worldSpaceVertices[
                adjVertIndices[0]
              ].subtract(worldSpaceVertices[adjVertIndices[1]]);

              const worldSpaceAdjEdgeCenterPoint = Vector3.Center(
                worldSpaceVertices[adjVertIndices[0]],
                worldSpaceVertices[adjVertIndices[1]],
              );

              const rotationVector = mesh
                .getTriangle()
                .getCenterPoint()
                .subtract(worldSpaceAdjEdgeCenterPoint);
              const adjTriangleMeshRotationVector = adjacentMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(worldSpaceAdjEdgeCenterPoint);

              const rotationDownAngle = Math.abs(
                Vector3.GetAngleBetweenVectors(
                  rotationVector,
                  adjTriangleMeshRotationVector,
                  worldSpaceAdjEdge,
                ),
              );

              if (direction === 1) {
                this.rotationAngle = -rotationDownAngle;
              } else {
                this.rotationAngle = Math.PI * 2 - rotationDownAngle;
              }

              if (adjacentMesh && adjacentMesh.getTriangleMesh()) {
                // computing length ratio between vector (edge's center - mesh's center) of the first triangle and vector (edge's center - mesh's center) of the second triangle to shift the scaling node during rotation
                const scalingNodeShiftRatio =
                  rotationVector.length() /
                  adjTriangleMeshRotationVector.length();

                this.scalingNodeOrigPos = this.scalingNode.position.clone();
                this.scalingNodeFinPos = this.scalingNode.position.scale(
                  1 / scalingNodeShiftRatio,
                );

                this.rotationAxis = edges[adjEdgeIndex];

                const notAdjVertexIndex = vertices.findIndex(
                  (v) =>
                    v !== (vertices && vertices[adjVertIndices[0]]) &&
                    v !== (vertices && vertices[adjVertIndices[1]]),
                );

                const adjBonesIndices =
                  mesh.getTriangleMeshBonesIndices(adjVertIndices);
                const notAdjBoneIndex = mesh.getTriangleMeshBonesIndices([
                  notAdjVertexIndex,
                ]);

                const adjTriangleMeshAdjBonesIndices =
                  adjacentMesh.getTriangleMeshBonesIndices(
                    adjTriangleMeshAdjVertIndices,
                  );
                const adjTriangleMeshNotAdjBoneIndex = [0, 1, 2].findIndex(
                  (e) =>
                    e !== adjTriangleMeshAdjBonesIndices[0] &&
                    e !== adjTriangleMeshAdjBonesIndices[1],
                );

                this.bonesIndices = [...adjBonesIndices, ...notAdjBoneIndex];

                this.skeleton =
                  triangleMesh &&
                  triangleMesh.skeleton &&
                  triangleMesh.skeleton.bones;

                const adjTriangleMeshSkeleton =
                  adjTriangleMesh &&
                  adjTriangleMesh.skeleton &&
                  adjTriangleMesh.skeleton.bones;

                const firstAdjBoneScaling =
                  this.skeleton && this.skeleton[adjBonesIndices[0]].scaling;
                const secondAdjBoneScaling =
                  this.skeleton && this.skeleton[adjBonesIndices[1]].scaling;
                const notAdjBoneScaling =
                  this.skeleton && this.skeleton[notAdjBoneIndex[0]].scaling;

                const bonesScaling = [
                  firstAdjBoneScaling,
                  secondAdjBoneScaling,
                  notAdjBoneScaling,
                ];
                this.bonesScaling = bonesScaling.map(
                  (boneScaling) => boneScaling && boneScaling.clone(),
                );

                if (adjTriangleMeshSkeleton) {
                  this.adjTriangleMeshBonesScaleY = [
                    adjTriangleMeshSkeleton[adjTriangleMeshAdjBonesIndices[0]]
                      .scaling.y,
                    adjTriangleMeshSkeleton[adjTriangleMeshAdjBonesIndices[1]]
                      .scaling.y,
                    adjTriangleMeshSkeleton[adjTriangleMeshNotAdjBoneIndex]
                      .scaling.y,
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
    const deltaTimeInMillis = this.scene.getEngine().getDeltaTime();
    const scalingNode = this.scalingNode as TransformNode;
    const skeleton = this.skeleton as Bone[];
    const bonesScaling = this.bonesScaling as Vector3[];

    if (this.amount < 1) {
      (this.flipNode as TransformNode).rotationQuaternion =
        Quaternion.RotationAxis(
          this.rotationAxis,
          Scalar.LerpAngle(0, this.rotationAngle, this.amount),
        );

      if (skeleton && bonesScaling && this.adjTriangleMeshBonesScaleY) {
        const bonesScaleYaw = bonesScaling.map(
          (boneScaling, i) =>
            boneScaling &&
            Scalar.Lerp(
              boneScaling.y,
              this.adjTriangleMeshBonesScaleY[i],
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
        this.scalingNodeOrigPos,
        this.scalingNodeFinPos,
        this.amount,
      );

      // MeshBuilder.CreateLines(`line${this.mesh.getTriangle().getId()}`, {
      //   points: [
      //     scalingNode.getAbsolutePosition(),
      //     scalingNode.getAbsolutePosition().scale(1.05),
      //   ],
      // });

      this.amount += rotationSpeed * (deltaTimeInMillis / 1000);
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
    const rpm = 120;
    const rotationSpeed = (rpm / 60) * Math.PI * 2;
    return rotationSpeed;
  }
}
export default MeshStateRotating;
