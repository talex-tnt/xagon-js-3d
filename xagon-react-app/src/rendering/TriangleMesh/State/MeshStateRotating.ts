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
import { Direction } from 'components/GameComponent/InputManager/FlipGesture';
import { DEBUG_RENDERING } from 'game-constants/debug';
import Triangle from 'models/Triangle';
import TriangleMesh from '..';
import IMeshState from './IMeshState';
import MeshStateIdle from './MeshStateIdle';

class MeshStateRotating extends IMeshState {
  private nextState: Nullable<IMeshState> = null;

  private scene: Scene;

  private mesh: TriangleMesh;

  private adjacentMesh: TriangleMesh;

  private rotation: {
    axis: Vector3;
    angle: number;
  } = {
    axis: Vector3.Zero(),
    angle: 0,
  };

  private flipNode: Nullable<TransformNode> = null;

  private scalingNode: {
    node: Nullable<TransformNode>;
    originalPosition: Vector3;
    finalPosition: Vector3;
    rotationAngle: number;
  } = {
    node: null,
    originalPosition: Vector3.Zero(),
    finalPosition: Vector3.Zero(),
    rotationAngle: 0,
  };

  private skeleton: {
    bones: Nullable<Bone[]>;
    bonesScaling: Nullable<Vector3>[];
    bonesIndices: number[];
    bonesDeformation: number[];
  } = {
    bones: [],
    bonesScaling: [],
    bonesIndices: [],
    bonesDeformation: [],
  };

  private adjBonesScalingY: number[] = [];

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
    this.adjacentMesh = adjacentTriangleMesh;

    const adjacentsVerticesMap = this.mesh.getAdjacentsVerticesMap(
      this.adjacentMesh.getTriangle(),
    );

    const trMesh = this.mesh.getTriangleMesh();
    if (trMesh) {
      this.scalingNode.node = trMesh.parent as TransformNode;

      const vertIndices = adjacentsVerticesMap.trAdjs;

      this.rotation.axis = this.computeRotationAxis(vertIndices);

      this.flipNode = this.computeFlipNodePosition(vertIndices);

      const rotationData = this.computeRotationData(vertIndices);

      if (rotationData) {
        if (direction === Direction.Down) {
          this.rotation.angle = -rotationData.rotationDownAngle;
        } else {
          this.rotation.angle = Math.PI * 2 - rotationData.rotationDownAngle;
        }
        // computing length ratio between vector (edge's center - mesh's center) of the first triangle and vector (edge's center - mesh's center) of the second triangle to shift the scaling node during rotation
        const scalingNodeShiftRatio =
          rotationData.adjRotationVector.length() /
          rotationData.rotationVector.length();

        const centerShiftVector =
          this.computeCenterShiftVector(adjacentsVerticesMap);

        this.scalingNode.originalPosition =
          this.scalingNode.node.position.clone();
        this.scalingNode.finalPosition = this.scalingNode.originalPosition
          .scale(scalingNodeShiftRatio)
          .subtract(centerShiftVector);

        this.skeleton.bones = trMesh.skeleton && trMesh.skeleton.bones;
        this.skeleton.bonesIndices = this.getBonesIndices(vertIndices);
        this.skeleton.bonesScaling = this.getBonesScaling();

        const adjVertIndices = adjacentsVerticesMap.adjTrAdjs;
        this.adjBonesScalingY = this.computeAdjBonesScalingY(adjVertIndices);

        const adjNotAdjVertexIndex = [0, 1, 2].findIndex(
          (e) => e !== adjVertIndices[0] && e !== adjVertIndices[1],
        );

        let vertIndex = vertIndices.findIndex((v) => v === 0);
        if (vertIndex === -1) {
          vertIndex = adjNotAdjVertexIndex;
        } else {
          vertIndex = adjVertIndices[vertIndex];
        }

        this.scalingNode.rotationAngle =
          this.computeNodeRotationAngle(vertIndex);

        this.skeleton.bonesDeformation =
          this.computeBonesDeformation(vertIndex);

        if (DEBUG_RENDERING) {
          const vertices = this.mesh.getVertices();
          if (vertices) {
            // eslint-disable-next-line no-console
            console.log(
              'TriangleID - ',
              this.mesh.getTriangle().getId(),
              'AdjacentTriangleID - ',
              this.adjacentMesh.getTriangle().getId(),
            );
            const meshSPHERE1 = MeshBuilder.CreateSphere(
              `tr1${this.mesh.getTriangle().getName()}`,
              {
                diameter: 0.1,
              },
            );
            meshSPHERE1.parent = this.scalingNode.node;
            meshSPHERE1.position = vertices[0].scale(1.5);
            const mat1 = new StandardMaterial(`color${vertices[0]}`, scene);
            mat1.diffuseColor = new Color3(0, 0, 1);
            meshSPHERE1.material = mat1;
            const meshSPHERE2 = MeshBuilder.CreateSphere(
              `tr2${this.mesh.getTriangle().getName()}`,
              {
                diameter: 0.1,
              },
            );
            meshSPHERE2.parent = this.scalingNode.node;
            meshSPHERE2.position = vertices[1].scale(1.5);
            const mat2 = new StandardMaterial(`color${vertices[1]}`, scene);
            mat2.diffuseColor = new Color3(0, 1, 0);
            meshSPHERE2.material = mat2;
            const meshSPHERE3 = MeshBuilder.CreateSphere(
              `tr3${this.mesh.getTriangle().getName()}`,
              {
                diameter: 0.1,
              },
            );
            meshSPHERE3.parent = this.scalingNode.node;
            meshSPHERE3.position = vertices[2].scale(1.5);
            const mat3 = new StandardMaterial(`color${vertices[2]}`, scene);
            mat3.diffuseColor = new Color3(1, 0, 0);
            meshSPHERE3.material = mat3;
          }
        }
      }
    }
  }

  public update(): Nullable<IMeshState> {
    const rotationSpeed = this.getRotationSpeed();
    const deltaTimeInMs = this.scene.getEngine().getDeltaTime();
    const scalingNode = this.scalingNode.node as TransformNode;
    const flipNode = this.flipNode as TransformNode;
    const skeletonBones = this.skeleton.bones as Bone[];
    const bonesScaling = this.skeleton.bonesScaling as Vector3[];
    const { bonesDeformation } = this.skeleton;

    if (this.amount < 1) {
      flipNode.rotationQuaternion = Quaternion.RotationAxis(
        this.rotation.axis,
        Scalar.LerpAngle(0, this.rotation.angle, this.amount),
      );
      scalingNode.position = Vector3.Lerp(
        this.scalingNode.originalPosition,
        this.scalingNode.finalPosition,
        this.amount,
      );
      scalingNode.rotation.y = Scalar.LerpAngle(
        0,
        -this.scalingNode.rotationAngle,
        this.amount,
      );

      if (
        skeletonBones &&
        bonesScaling &&
        this.adjBonesScalingY &&
        bonesDeformation
      ) {
        skeletonBones.slice(0, 2).forEach((b, i) => {
          const { rotation } = b;
          rotation.y -= Scalar.Lerp(
            0,
            bonesDeformation[i],
            rotationSpeed * (deltaTimeInMs / 1000),
          );
          b.setRotation(rotation);
        });

        const bonesScaleY = bonesScaling.map(
          (boneScaling, i) =>
            boneScaling &&
            Scalar.Lerp(boneScaling.y, this.adjBonesScalingY[i], this.amount),
        );
        this.skeleton.bonesIndices.forEach((boneIndex, i) => {
          skeletonBones[boneIndex].setScale(
            new Vector3(
              skeletonBones[boneIndex].scaling.x,
              bonesScaleY[i],
              skeletonBones[boneIndex].scaling.z,
            ),
          );
        });
      }
      this.amount += rotationSpeed * (deltaTimeInMs / 1000);

      if (DEBUG_RENDERING) {
        const meshLine = MeshBuilder.CreateSphere(
          `tr${this.mesh.getTriangle().getName()}`,
          {
            diameter: 0.1,
          },
        );
        meshLine.parent = scalingNode;
      }
    } else if (this.amount >= 1) {
      scalingNode.rotation.y = Scalar.LerpAngle(
        0,
        -this.scalingNode.rotationAngle,
        0,
      );
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

  private getRotationSpeed(): number {
    const rpm = 5;
    const rotationSpeed = (rpm / 60) * Math.PI * 2;
    return rotationSpeed;
  }

  private computeRotationAxis(vertIndices: number[]): Vector3 {
    const vertIndicesSum = this.mesh.getTriangleMeshIndicesSum(vertIndices);
    const edgeIndex = this.mesh.getTriangleMeshFlipEdgeIndex(vertIndicesSum);
    const edges = this.mesh.getEdges() as Vector3[];

    return edges[edgeIndex];
  }

  private computeFlipNodePosition(
    vertIndices: number[],
  ): Nullable<TransformNode> {
    if (this.scalingNode.node) {
      const flipNode = this.scalingNode.node.parent as TransformNode;
      const vertices = this.mesh.getVertices();
      if (flipNode && vertices) {
        const flipNodeCenter = Vector3.Zero(); // node position in object space
        const edgeCenterPoint = Vector3.Center(
          vertices[vertIndices[0]],
          vertices[vertIndices[1]],
        );

        flipNode.setPositionWithLocalVector(edgeCenterPoint);
        this.scalingNode.node.position = flipNodeCenter.subtract(
          flipNode.position,
        );
        return flipNode;
      }
    }
    return null;
  }

  private computeCenterShiftVector(
    verticesMap: Record<string, number[]>,
  ): Vector3 {
    const adjVertices = this.adjacentMesh.getVertices();
    const vertices = this.mesh.getVertices();
    const vertIndices = verticesMap.trAdjs;
    const adjVertIndices = verticesMap.adjTrAdjs;

    if (adjVertices && vertices) {
      const vectorProjectionRatio = this.computeVectorProjectionRatio(
        vertices,
        vertIndices,
      );

      const adjVectorProjectionRatio = this.computeVectorProjectionRatio(
        adjVertices,
        adjVertIndices,
      );

      const deltaCenterShift = vectorProjectionRatio - adjVectorProjectionRatio;

      const edgeVector = vertices[vertIndices[1]].subtract(
        vertices[vertIndices[0]],
      );
      const centerShiftVector = edgeVector.scale(deltaCenterShift);

      return centerShiftVector;
    }
    return Vector3.Zero();
  }

  private getBonesIndices(indices: number[]): number[] {
    const adjBonesIndices = this.mesh.getTriangleMeshBonesIndices(indices);

    const notAdjBoneIndex = [0, 1, 2].findIndex(
      (e) => e !== adjBonesIndices[0] && e !== adjBonesIndices[1],
    );

    const bonesIndices = [...adjBonesIndices, notAdjBoneIndex];

    return bonesIndices;
  }

  private getBonesScaling(): Vector3[] {
    if (this.skeleton.bones) {
      const firstBoneScaling =
        this.skeleton.bones[this.skeleton.bonesIndices[0]].scaling;
      const secondBoneScaling =
        this.skeleton.bones[this.skeleton.bonesIndices[1]].scaling;
      const notAdjBoneScaling =
        this.skeleton.bones[this.skeleton.bonesIndices[2]].scaling;

      const bonesScaling = [
        firstBoneScaling,
        secondBoneScaling,
        notAdjBoneScaling,
      ];
      return bonesScaling.map((boneScaling) => boneScaling.clone());
    }
    // eslint-disable-next-line no-console
    console.assert(this.skeleton.bones, 'Skeleton must exist');
    return [Vector3.One(), Vector3.One(), Vector3.One()];
  }

  private computeAdjBonesScalingY(indices: number[]): number[] {
    let adjBonesScalingY = [1, 1, 1];
    const adjTriangleMesh = this.adjacentMesh.getTriangleMesh();

    if (adjTriangleMesh) {
      const skeleton =
        adjTriangleMesh.skeleton && adjTriangleMesh.skeleton.bones;

      if (skeleton) {
        const bonesIndices =
          this.adjacentMesh.getTriangleMeshBonesIndices(indices);
        const notAdjBoneIndex = [0, 1, 2].findIndex(
          (e) => e !== bonesIndices[0] && e !== bonesIndices[1],
        );

        adjBonesScalingY = [
          skeleton[bonesIndices[0]].scaling.y,
          skeleton[bonesIndices[1]].scaling.y,
          skeleton[notAdjBoneIndex].scaling.y,
        ];
      }
    }
    return adjBonesScalingY;
  }

  private computeNodeRotationAngle(vertIndex: number): number {
    const matrix = this.computeMatrix();

    const centerPointAfterRotation = Vector3.TransformCoordinates(
      new Vector3(0, 0, 0),
      matrix,
    );
    const vertices = this.mesh.getVertices();

    if (vertices) {
      const worldVertAfterRotation = vertices.map((v) =>
        Vector3.TransformCoordinates(v, matrix),
      );

      const adjTriangle = this.adjacentMesh.getTriangle();
      const adjTriangleCenter = adjTriangle.getCenterPoint();
      const adjTriangleVertices = adjTriangle.getVertices();
      const adjPointCenterVector =
        adjTriangleVertices[vertIndex].subtract(adjTriangleCenter);

      const nodeRotationAngle = Vector3.GetAngleBetweenVectors(
        worldVertAfterRotation[0].subtract(centerPointAfterRotation),
        adjPointCenterVector,
        adjTriangleCenter,
      );

      return nodeRotationAngle;
    }
    return 0;
  }

  private computeMatrix(): Matrix {
    const mesh = this.mesh.getTriangleMesh();
    if (mesh && this.flipNode && this.scalingNode.node) {
      this.flipNode.rotationQuaternion = Quaternion.RotationAxis(
        this.rotation.axis,
        this.rotation.angle,
      );
      this.scalingNode.node.position = this.scalingNode.finalPosition;

      const rotationNode = this.scalingNode.node.parent as TransformNode;
      const positionNode = rotationNode.parent as TransformNode;
      positionNode.computeWorldMatrix(true);
      rotationNode.computeWorldMatrix(true);
      this.flipNode.computeWorldMatrix(true);
      this.scalingNode.node.computeWorldMatrix(true);
      const matrix = mesh.computeWorldMatrix(true);

      // RESET Nodes transformations after compute Matrix
      this.flipNode.rotationQuaternion = Quaternion.RotationAxis(
        this.rotation.axis,
        0,
      );
      this.scalingNode.node.position = Vector3.Lerp(
        this.scalingNode.finalPosition,
        this.scalingNode.originalPosition,
        1,
      );
      return matrix;
    }
    // eslint-disable-next-line no-console
    console.assert(mesh, 'Mesh must exist');
    return Matrix.Zero();
  }

  private computeBonesDeformation(index: number): number[] {
    const customTriangleVertices = this.computeCustomTriangleVertices(
      this.adjacentMesh,
      index,
    );

    const bonesRotations = this.adjacentMesh.computeAngleBonesRotation({
      triangle: new Triangle(
        BigInt(0),
        customTriangleVertices[0],
        customTriangleVertices[1],
        customTriangleVertices[2],
      ),
    });
    const bonesFirstRotations = this.mesh.getAngleBonesRotation();

    const bone1DeltaRotation = bonesFirstRotations[0] + bonesRotations[1];
    const bone2DeltaRotation = bonesFirstRotations[1] + bonesRotations[0];

    return [bone1DeltaRotation, bone2DeltaRotation];
  }

  private computeCustomTriangleVertices(
    mesh: TriangleMesh,
    index: number,
  ): Vector3[] {
    let customTriangleIndices: number[] = [];
    switch (index) {
      case 0: {
        customTriangleIndices = [0, 1, 2];
        break;
      }
      case 1: {
        customTriangleIndices = [1, 2, 0];
        break;
      }
      case 2: {
        customTriangleIndices = [2, 0, 1];
        break;
      }
      default:
    }
    const vertices = mesh.getTriangle().getVertices();

    const customTriangleVertices = customTriangleIndices.map(
      (i) => vertices[i],
    );

    return customTriangleVertices;
  }

  private computeRotationData(indices: number[]): Nullable<{
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
          this.adjacentMesh.getTriangle().getCenterPoint(),
          Matrix.Invert(triangleMeshMatrix),
        );

        const point1 = this.computeVectorProjectionPoint({
          vertices: objSpaceData.vertices,
          index1: indices[1],
          index2: indices[0],
        });
        const point2 = this.computeVectorProjectionPoint({
          vertices: objSpaceData.vertices,
          center: centerADJ,
          index1: indices[0],
          index2: indices[1],
        });

        const vectorCenterPoint = Vector3.Zero().subtract(point1);
        const adjVectorCenterPoint = centerADJ.subtract(point2);
        const normal = Vector3.Cross(vectorCenterPoint, adjVectorCenterPoint);

        const rotationDownAngle = Math.abs(
          Vector3.GetAngleBetweenVectors(
            vectorCenterPoint,
            adjVectorCenterPoint,
            normal,
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
        const adjRotationVector = this.adjacentMesh
          .getTriangle()
          .getCenterPoint()
          .subtract(worldSpaceAdjEdgeCenterPoint);

        return { rotationVector, adjRotationVector, rotationDownAngle };
      }
    }
    return null;
  }

  private computeVectorProjectionPoint({
    vertices,
    center = Vector3.Zero(),
    index1,
    index2,
  }: {
    vertices: Vector3[];
    center?: Vector3;
    index1: number;
    index2: number;
  }): Vector3 {
    const worldSpaceAdjEdge = vertices[index1].subtract(vertices[index2]);

    const projectionAngle = Vector3.GetAngleBetweenVectors(
      center.subtract(vertices[index2]),
      worldSpaceAdjEdge,
      Vector3.Cross(center.subtract(vertices[index2]), worldSpaceAdjEdge),
    );

    const scalarProjection =
      center.subtract(vertices[index2]).length() * Math.cos(projectionAngle);

    const point = vertices[index2].add(
      worldSpaceAdjEdge.scale(scalarProjection / worldSpaceAdjEdge.length()),
    );

    return point;
  }

  private computeVectorProjectionRatio(
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
