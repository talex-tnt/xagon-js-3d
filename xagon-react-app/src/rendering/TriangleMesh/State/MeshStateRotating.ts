import {
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  Scalar,
  Bone,
  MeshBuilder,
  // MeshBuilder, #DEBUG
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

  private centerShiftVector: Vector3 = Vector3.Zero();

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
            const vertIndices = Object.keys(adjacentsVerticesMap).map((i) =>
              Number(i),
            );

            const adjVertIndices = Object.values(adjacentsVerticesMap);

            const vertIndicesSum = mesh.getTriangleMeshIndicesSum(vertIndices);

            const edgeIndex = mesh.getTriangleMeshFlipEdgeIndex(vertIndicesSum);

            if (flipNode) {
              const flipNodeCenter = Vector3.Zero(); // node position in object space
              const edgeCenterPoint = Vector3.Center(
                vertices[vertIndices[0]],
                vertices[vertIndices[1]],
              );

              flipNode.setPositionWithLocalVector(edgeCenterPoint);
              this.scalingNode.position = flipNodeCenter.subtract(
                flipNode.position,
              );
              this.flipNode = flipNode;

              const worldSpaceVertices = mesh.getTriangle().getVertices();

              const worldSpaceAdjEdge = worldSpaceVertices[
                vertIndices[0]
              ].subtract(worldSpaceVertices[vertIndices[1]]);

              const worldSpaceAdjEdgeCenterPoint = Vector3.Center(
                worldSpaceVertices[vertIndices[0]],
                worldSpaceVertices[vertIndices[1]],
              );

              const rotationVector = mesh
                .getTriangle()
                .getCenterPoint()
                .subtract(worldSpaceAdjEdgeCenterPoint);
              const adjRotationVector = adjacentMesh
                .getTriangle()
                .getCenterPoint()
                .subtract(worldSpaceAdjEdgeCenterPoint);

              const rotationDownAngle = Math.abs(
                Vector3.GetAngleBetweenVectors(
                  rotationVector,
                  adjRotationVector,
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
                  adjRotationVector.length() / rotationVector.length();
                const edgeVector = vertices[vertIndices[1]].subtract(
                  vertices[vertIndices[0]],
                );

                const vectorProjectionRatio = this.computeVectorProjectionRatio(
                  vertices,
                  vertIndices,
                );

                const adjVertices = adjacentMesh.getVertices();
                if (adjVertices) {
                  const adjVectorProjectionRatio =
                    this.computeVectorProjectionRatio(
                      adjVertices,
                      adjVertIndices,
                    );

                  const deltaCenterShift =
                    vectorProjectionRatio - adjVectorProjectionRatio;
                  this.centerShiftVector = edgeVector.scale(deltaCenterShift);

                  // console.log(angle);

                  this.scalingNodeOrigPos = this.scalingNode.position.clone();
                  this.scalingNodeFinPos = this.scalingNode.position.scale(
                    scalingNodeShiftRatio,
                  );

                  this.rotationAxis = edges[edgeIndex];

                  const notAdjVertexIndex = vertices.findIndex(
                    (v) =>
                      v !== (vertices && vertices[vertIndices[0]]) &&
                      v !== (vertices && vertices[vertIndices[1]]),
                  );

                  const bonesIndices =
                    mesh.getTriangleMeshBonesIndices(vertIndices);
                  const notAdjBoneIndex = mesh.getTriangleMeshBonesIndices([
                    notAdjVertexIndex,
                  ]);

                  const adjBonesIndices =
                    adjacentMesh.getTriangleMeshBonesIndices(adjVertIndices);
                  const adjNotAdjBoneIndex = [0, 1, 2].findIndex(
                    (e) => e !== adjBonesIndices[0] && e !== adjBonesIndices[1],
                  );

                  this.bonesIndices = [...bonesIndices, ...notAdjBoneIndex];

                  this.skeleton =
                    triangleMesh &&
                    triangleMesh.skeleton &&
                    triangleMesh.skeleton.bones;

                  const adjSkeleton =
                    adjTriangleMesh &&
                    adjTriangleMesh.skeleton &&
                    adjTriangleMesh.skeleton.bones;

                  const firstBoneScaling =
                    this.skeleton && this.skeleton[bonesIndices[0]].scaling;
                  const secondBoneScaling =
                    this.skeleton && this.skeleton[bonesIndices[1]].scaling;
                  const notAdjBoneScaling =
                    this.skeleton && this.skeleton[notAdjBoneIndex[0]].scaling;

                  const bonesScaling = [
                    firstBoneScaling,
                    secondBoneScaling,
                    notAdjBoneScaling,
                  ];
                  this.bonesScaling = bonesScaling.map(
                    (boneScaling) => boneScaling && boneScaling.clone(),
                  );

                  if (adjSkeleton) {
                    this.adjTriangleMeshBonesScaleY = [
                      adjSkeleton[adjBonesIndices[0]].scaling.y,
                      adjSkeleton[adjBonesIndices[1]].scaling.y,
                      adjSkeleton[adjNotAdjBoneIndex].scaling.y,
                    ];
                  }
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
    const flipNode = this.flipNode as TransformNode;
    const skeleton = this.skeleton as Bone[];
    const bonesScaling = this.bonesScaling as Vector3[];

    if (this.amount < 1) {
      flipNode.rotationQuaternion = Quaternion.RotationAxis(
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
        this.scalingNodeFinPos.subtract(this.centerShiftVector),
        this.amount,
      );

      // #DEBUG
      MeshBuilder.CreateLines(`line${this.mesh.getTriangle().getId()}`, {
        points: [
          scalingNode.getAbsolutePosition(),
          scalingNode.getAbsolutePosition().scale(1.01),
        ],
      });

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
    const rpm = 1.2;
    const rotationSpeed = (rpm / 60) * Math.PI * 2;
    return rotationSpeed;
  }

  public computeVectorProjectionRatio(
    vertices: Vector3[],
    indices: number[],
  ): number {
    const vectorCenterVertex = Vector3.Zero().subtract(vertices[indices[0]]);
    const edgeVector = vertices[indices[1]].subtract(vertices[indices[0]]);
    const normalToComputeAngle = Vector3.Cross(vectorCenterVertex, edgeVector);

    const projectionAngle = Vector3.GetAngleBetweenVectors(
      vectorCenterVertex,
      edgeVector,
      normalToComputeAngle,
    );

    const scalarProjection =
      vectorCenterVertex.length() * Math.cos(projectionAngle);

    const vectorProjectionRatio = Math.abs(
      scalarProjection / edgeVector.length(),
    );

    return vectorProjectionRatio;
  }
}
export default MeshStateRotating;
