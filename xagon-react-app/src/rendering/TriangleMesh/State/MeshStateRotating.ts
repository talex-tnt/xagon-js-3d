import {
  Nullable,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
  Scalar,
  Bone,
  MeshBuilder,
  Color3,
  StandardMaterial,
  Matrix,
} from '@babylonjs/core';
import { DEBUG_RENDERING } from 'constants/debug';
import Triangle from 'models/Triangle';
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

  private nodeRotationAngle = 0;

  private bonesDeformation;

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
      if (triangleMesh) {
        this.scalingNode = triangleMesh.parent as TransformNode;

        if (this.scalingNode) {
          const flipNode = this.scalingNode.parent as TransformNode;

          if (edges && vertices) {
            const vertIndices = adjacentsVerticesMap.trAdjs;
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

              const rotationData = this.computeRotationData(
                adjacentMesh,
                vertIndices,
              );

              if (rotationData) {
                if (direction === 1) {
                  this.rotationAngle = -rotationData.rotationDownAngle;
                } else {
                  this.rotationAngle =
                    Math.PI * 2 - rotationData.rotationDownAngle;
                }

                if (adjacentMesh && adjacentMesh.getTriangleMesh()) {
                  // computing length ratio between vector (edge's center - mesh's center) of the first triangle and vector (edge's center - mesh's center) of the second triangle to shift the scaling node during rotation
                  const scalingNodeShiftRatio =
                    rotationData.adjRotationVector.length() /
                    rotationData.rotationVector.length();

                  const edgeVector = vertices[vertIndices[1]].subtract(
                    vertices[vertIndices[0]],
                  );

                  const vectorProjectionRatio =
                    this.computeVectorProjectionRatio(vertices, vertIndices);

                  const adjVertices = adjacentMesh.getVertices();
                  const adjVertIndices = adjacentsVerticesMap.adjTrAdjs;
                  const adjNotAdjVertexIndex = [0, 1, 2].findIndex(
                    (e) => e !== adjVertIndices[0] && e !== adjVertIndices[1],
                  );

                  if (adjVertices) {
                    const adjVectorProjectionRatio =
                      this.computeVectorProjectionRatio(
                        adjVertices,
                        adjVertIndices,
                      );

                    const deltaCenterShift =
                      vectorProjectionRatio - adjVectorProjectionRatio;
                    const centerShiftVector =
                      edgeVector.scale(deltaCenterShift);

                    this.scalingNodeOrigPos = this.scalingNode.position.clone();
                    this.scalingNodeFinPos = this.scalingNode.position
                      .scale(scalingNodeShiftRatio)
                      .subtract(centerShiftVector);

                    this.rotationAxis = edges[edgeIndex];

                    const bonesIndices =
                      mesh.getTriangleMeshBonesIndices(vertIndices);

                    const notAdjBoneIndex = [0, 1, 2].findIndex(
                      (e) => e !== bonesIndices[0] && e !== bonesIndices[1],
                    );

                    const adjBonesIndices =
                      adjacentMesh.getTriangleMeshBonesIndices(adjVertIndices);
                    const adjNotAdjBoneIndex = [0, 1, 2].findIndex(
                      (e) =>
                        e !== adjBonesIndices[0] && e !== adjBonesIndices[1],
                    );

                    this.bonesIndices = [...bonesIndices, notAdjBoneIndex];

                    this.skeleton =
                      triangleMesh &&
                      triangleMesh.skeleton &&
                      triangleMesh.skeleton.bones;

                    const firstBoneScaling =
                      this.skeleton && this.skeleton[bonesIndices[0]].scaling;
                    const secondBoneScaling =
                      this.skeleton && this.skeleton[bonesIndices[1]].scaling;
                    const notAdjBoneScaling =
                      this.skeleton && this.skeleton[notAdjBoneIndex].scaling;

                    const bonesScaling = [
                      firstBoneScaling,
                      secondBoneScaling,
                      notAdjBoneScaling,
                    ];
                    this.bonesScaling = bonesScaling.map(
                      (boneScaling) => boneScaling && boneScaling.clone(),
                    );

                    const adjTriangleMesh = adjacentMesh.getTriangleMesh();

                    if (adjTriangleMesh) {
                      const adjSkeleton =
                        adjTriangleMesh.skeleton &&
                        adjTriangleMesh.skeleton.bones;

                      if (adjSkeleton) {
                        this.adjTriangleMeshBonesScaleY = [
                          adjSkeleton[adjBonesIndices[0]].scaling.y,
                          adjSkeleton[adjBonesIndices[1]].scaling.y,
                          adjSkeleton[adjNotAdjBoneIndex].scaling.y,
                        ];
                      }

                      if (triangleMesh.skeleton && adjTriangleMesh.skeleton) {
                        const adjPointCenterVectors = [
                          adjacentMesh
                            .getTriangle()
                            .p1()
                            .subtract(
                              adjacentMesh.getTriangle().getCenterPoint(),
                            ),
                          adjacentMesh
                            .getTriangle()
                            .p2()
                            .subtract(
                              adjacentMesh.getTriangle().getCenterPoint(),
                            ),
                          adjacentMesh
                            .getTriangle()
                            .p3()
                            .subtract(
                              adjacentMesh.getTriangle().getCenterPoint(),
                            ),
                        ];

                        // Nodes transformations to compute Matrix
                        flipNode.rotationQuaternion = Quaternion.RotationAxis(
                          this.rotationAxis,
                          this.rotationAngle,
                        );
                        this.scalingNode.position = Vector3.Lerp(
                          this.scalingNodeOrigPos,
                          this.scalingNodeFinPos,
                          1,
                        );

                        const rotationNode = this.scalingNode
                          .parent as TransformNode;
                        const positionNode =
                          rotationNode.parent as TransformNode;
                        positionNode.computeWorldMatrix(true);
                        rotationNode.computeWorldMatrix(true);
                        this.flipNode.computeWorldMatrix(true);
                        this.scalingNode.computeWorldMatrix(true);
                        const matrix = triangleMesh.computeWorldMatrix(true);

                        // RESET Nodes transformations after compute Matrix
                        flipNode.rotationQuaternion = Quaternion.RotationAxis(
                          this.rotationAxis,
                          0,
                        );
                        this.scalingNode.position = Vector3.Lerp(
                          this.scalingNodeFinPos,
                          this.scalingNodeOrigPos,
                          1,
                        );

                        const centerPointAfterRotation =
                          Vector3.TransformCoordinates(
                            new Vector3(0, 0, 0),
                            matrix,
                          );

                        const worldVertAfterRotation = vertices.map((v) =>
                          Vector3.TransformCoordinates(v, matrix),
                        );

                        let vertIndex = vertIndices.findIndex((v) => v === 0);

                        if (vertIndex === -1) {
                          vertIndex = adjNotAdjVertexIndex;
                        } else {
                          vertIndex = adjVertIndices[vertIndex];
                        }

                        this.nodeRotationAngle = Vector3.GetAngleBetweenVectors(
                          worldVertAfterRotation[0].subtract(
                            centerPointAfterRotation,
                          ),
                          adjPointCenterVectors[vertIndex],
                          adjacentMesh.getTriangle().getCenterPoint(),
                        );

                        const customTriangleIndices = [vertIndex];

                        switch (vertIndex) {
                          case 0: {
                            customTriangleIndices.push(1);
                            customTriangleIndices.push(2);
                            break;
                          }
                          case 1: {
                            customTriangleIndices.push(2);
                            customTriangleIndices.push(0);
                            break;
                          }
                          case 2: {
                            customTriangleIndices.push(0);
                            customTriangleIndices.push(1);
                            break;
                          }
                          default:
                        }

                        const adjTriangleVertices = adjacentMesh
                          .getTriangle()
                          .getVertices();

                        const customTriangleVertices =
                          customTriangleIndices.map(
                            (i) => adjTriangleVertices[i],
                          );

                        const bonesRotations =
                          adjacentMesh.computeAngleBonesRotation({
                            triangle: new Triangle(
                              BigInt(0),
                              customTriangleVertices[0],
                              customTriangleVertices[1],
                              customTriangleVertices[2],
                            ),
                          });
                        const bonesFirstRotations =
                          this.mesh.getAngleBonesRotation();

                        const bone1DeltaRotation =
                          bonesFirstRotations[0] + bonesRotations[1];
                        const bone2DeltaRotation =
                          bonesFirstRotations[1] + bonesRotations[0];

                        this.bonesDeformation = [
                          bone1DeltaRotation,
                          bone2DeltaRotation,
                        ];

                        if (DEBUG_RENDERING) {
                          // eslint-disable-next-line no-console
                          console.log(
                            'TriangleID - ',
                            this.mesh.getTriangle().getId(),
                            'AdjacentTriangleID - ',
                            adjacentMesh.getTriangle().getId(),
                          );
                          const meshSPHERE1 = MeshBuilder.CreateSphere(
                            `tr1${this.mesh.getTriangle().getName()}`,
                            {
                              diameter: 0.1,
                            },
                          );
                          meshSPHERE1.parent = this.scalingNode;
                          meshSPHERE1.position = vertices[0].scale(1.5);
                          const mat1 = new StandardMaterial(
                            `color${vertices[0]}`,
                            scene,
                          );
                          mat1.diffuseColor = new Color3(0, 0, 1);
                          meshSPHERE1.material = mat1;
                          const meshSPHERE2 = MeshBuilder.CreateSphere(
                            `tr2${this.mesh.getTriangle().getName()}`,
                            {
                              diameter: 0.1,
                            },
                          );
                          meshSPHERE2.parent = this.scalingNode;
                          meshSPHERE2.position = vertices[1].scale(1.5);
                          const mat2 = new StandardMaterial(
                            `color${vertices[1]}`,
                            scene,
                          );
                          mat2.diffuseColor = new Color3(0, 1, 0);
                          meshSPHERE2.material = mat2;
                          const meshSPHERE3 = MeshBuilder.CreateSphere(
                            `tr3${this.mesh.getTriangle().getName()}`,
                            {
                              diameter: 0.1,
                            },
                          );
                          meshSPHERE3.parent = this.scalingNode;
                          meshSPHERE3.position = vertices[2].scale(1.5);
                          const mat3 = new StandardMaterial(
                            `color${vertices[2]}`,
                            scene,
                          );
                          mat3.diffuseColor = new Color3(1, 0, 0);
                          meshSPHERE3.material = mat3;
                        }
                      }
                    }
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
    const { bonesDeformation } = this;

    if (this.amount < 1) {
      flipNode.rotationQuaternion = Quaternion.RotationAxis(
        this.rotationAxis,
        Scalar.LerpAngle(0, this.rotationAngle, this.amount),
      );

      if (
        skeleton &&
        bonesScaling &&
        this.adjTriangleMeshBonesScaleY &&
        bonesDeformation
      ) {
        const bonesScaleY = bonesScaling.map(
          (boneScaling, i) =>
            boneScaling &&
            Scalar.Lerp(
              boneScaling.y,
              this.adjTriangleMeshBonesScaleY[i],
              this.amount,
            ),
        );
        skeleton.slice(0, 2).forEach((b, i) => {
          const { rotation } = b;
          rotation.y -= Scalar.Lerp(
            0,
            bonesDeformation[i],
            rotationSpeed * (deltaTimeInMillis / 1000),
          );
          b.setRotation(rotation);
        });

        this.bonesIndices.forEach((boneIndex, i) => {
          skeleton[boneIndex].setScale(
            new Vector3(
              skeleton[boneIndex].scaling.x,
              bonesScaleY[i],
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
      scalingNode.rotation.y = Scalar.LerpAngle(
        0,
        -this.nodeRotationAngle,
        this.amount,
      );

      // if (DEBUG_RENDERING) {
      //   const meshLine = MeshBuilder.CreateSphere(
      //     `tr${this.mesh.getTriangle().getName()}`,
      //     {
      //       diameter: 0.1,
      //     },
      //   );
      //   meshLine.parent = scalingNode;
      // }
      this.amount += rotationSpeed * (deltaTimeInMillis / 1000);
    } else if (this.amount >= 1) {
      scalingNode.rotation.y = Scalar.LerpAngle(0, -this.nodeRotationAngle, 0);
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
    const rpm = 30;
    const rotationSpeed = (rpm / 60) * Math.PI * 2;
    return rotationSpeed;
  }

  public computeRotationData(
    adjMesh: TriangleMesh,
    indices: number[],
  ): Nullable<{
    rotationVector: Vector3;
    adjRotationVector: Vector3;
    rotationDownAngle: number;
  }> {
    const worldSpaceVertices = this.mesh.getTriangle().getVertices();

    const triangleMesh = this.mesh.getTriangleMesh();

    if (triangleMesh) {
      const objSpaceData = this.mesh.computeObjSpaceData(triangleMesh);

      if (objSpaceData) {
        const triangleMeshMatrix = triangleMesh.computeWorldMatrix(true);

        const centerADJ = Vector3.TransformCoordinates(
          adjMesh.getTriangle().getCenterPoint(),
          Matrix.Invert(triangleMeshMatrix),
        );

        const worldSpaceAdjEdge1 = objSpaceData.vertices[indices[1]].subtract(
          objSpaceData.vertices[indices[0]],
        );

        const projectionAngle1 = Vector3.GetAngleBetweenVectors(
          Vector3.Zero().subtract(objSpaceData.vertices[indices[0]]),
          worldSpaceAdjEdge1,
          Vector3.Cross(
            Vector3.Zero().subtract(objSpaceData.vertices[indices[0]]),
            worldSpaceAdjEdge1,
          ),
        );

        const scalarProjection =
          Vector3.Zero().subtract(objSpaceData.vertices[indices[0]]).length() *
          Math.cos(projectionAngle1);

        const point1 = objSpaceData.vertices[indices[0]].add(
          worldSpaceAdjEdge1.scale(
            scalarProjection / worldSpaceAdjEdge1.length(),
          ),
        );

        const worldSpaceAdjEdge2 = objSpaceData.vertices[indices[0]].subtract(
          objSpaceData.vertices[indices[1]],
        );

        const projectionAngle2 = Vector3.GetAngleBetweenVectors(
          centerADJ.subtract(objSpaceData.vertices[indices[1]]),
          worldSpaceAdjEdge2,
          Vector3.Cross(
            centerADJ.subtract(objSpaceData.vertices[indices[1]]),
            worldSpaceAdjEdge2,
          ),
        );

        const scalarProjection2 =
          centerADJ.subtract(objSpaceData.vertices[indices[1]]).length() *
          Math.cos(projectionAngle2);

        const point2 = objSpaceData.vertices[indices[1]].add(
          worldSpaceAdjEdge2.scale(
            scalarProjection2 / worldSpaceAdjEdge2.length(),
          ),
        );

        const rotationDownAngle = Math.abs(
          Vector3.GetAngleBetweenVectors(
            Vector3.Zero().subtract(point1),
            centerADJ.subtract(point2),
            Vector3.Cross(
              Vector3.Zero().subtract(point1),
              centerADJ.subtract(point2),
            ),
          ),
        );

        const worldSpaceAdjEdgeCenterPoint = Vector3.Center(
          worldSpaceVertices[indices[0]],
          worldSpaceVertices[indices[1]],
        );
        const rotationVector = this.mesh
          .getTriangle()
          .getCenterPoint()
          .subtract(worldSpaceAdjEdgeCenterPoint);
        const adjRotationVector = adjMesh
          .getTriangle()
          .getCenterPoint()
          .subtract(worldSpaceAdjEdgeCenterPoint);

        return { rotationVector, adjRotationVector, rotationDownAngle };
      }
    }
    return null;
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
