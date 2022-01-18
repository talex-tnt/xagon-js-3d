import Triangle, { Type } from 'models/Triangle';
import {
  AbstractMesh,
  Scene,
  TransformNode,
  Vector3,
  StandardMaterial,
  Nullable,
  Quaternion,
  Matrix,
  MeshBuilder,
} from '@babylonjs/core';
import { addAxisToScene, math } from 'utils';
import { k_triangleAssetName } from 'game-constants/identifiers';
import { k_epsilon, k_triangleScale } from 'game-constants';
import { DEBUG_RENDERING } from 'game-constants/debug';
import EquilateralTriangleProvider from './EquilateralTriangleProvider';
import IMeshState from './State/IMeshState';
import MeshStateIdle from './State/MeshStateIdle';

class TriangleMesh {
  private scene: Scene;

  private triangle: Triangle;

  private triangleMesh: Nullable<AbstractMesh>;

  private triangleEdges: Nullable<Vector3[]> = null;

  private triangleVertices: Nullable<Vector3[]> = null;

  private equilateralTriangleRadius: number;

  private scalingRatio: number;

  private skeletonBonesScaling?: Vector3[];

  private skeletonBonesRotation?: Vector3[];

  private bonesRotationAngle: number[] = [];

  private scalingNodeInitialPosition: Vector3 = Vector3.Zero();

  private currentState: IMeshState;

  public constructor({
    scene,
    triangle,
    equilateralTriangleProvider,
  }: {
    scene: Scene;
    triangle: Triangle;
    equilateralTriangleProvider: EquilateralTriangleProvider;
  }) {
    this.currentState = new MeshStateIdle({ triangleMesh: this, scene });
    this.triangle = triangle;
    this.triangleMesh = null;
    this.scene = scene;

    const TRIANGLE_RADIUS = 1;
    const TRIANGLE_SIDE = TRIANGLE_RADIUS * (3 / Math.sqrt(3));

    const equilateralTriangle =
      equilateralTriangleProvider.findEquilateralTriangle();

    const triangleEdgeLength = equilateralTriangle
      .p1()
      .subtract(equilateralTriangle.p2())
      .length();
    this.scalingRatio =
      (1 / TRIANGLE_SIDE) * triangleEdgeLength * k_triangleScale;

    this.equilateralTriangleRadius = equilateralTriangle
      .p1()
      .subtract(equilateralTriangle?.getCenterPoint())
      .length();
    const mesh = scene.getMeshByName(k_triangleAssetName);

    if (mesh) {
      const triangleMesh = mesh.clone(triangle.getName(), mesh);
      this.triangleMesh = triangleMesh;
      if (triangleMesh) {
        triangleMesh.metadata = { triangleMesh: this };

        this.createNodesStructure(scene);

        this.setupPosition(scene, this.scalingRatio);

        triangleMesh.skeleton =
          mesh &&
          mesh.skeleton &&
          mesh.skeleton.clone(`skeleton${triangle.getId()}`);

        const angleBonesRotation = this.computeBonesRotationAngle({
          triangle: this.triangle,
        });

        this.setAngleBonesRotation(angleBonesRotation);

        const rotations = this.computeBonesDeformation();
        const bonesScaleY = this.computeBonesScaling();

        if (
          this.triangleMesh &&
          this.triangleMesh.skeleton &&
          rotations &&
          bonesScaleY
        ) {
          this.triangleMesh.skeleton.bones.forEach((bone, index) => {
            bone.setRotation(rotations[index]);
            bone.scale(1, bonesScaleY[index], 1);
          });

          this.skeletonBonesScaling = this.triangleMesh.skeleton.bones.map(
            ({ scaling }) => new Vector3(scaling.x, scaling.y, scaling.z),
          );
          this.skeletonBonesRotation = this.triangleMesh.skeleton.bones.map(
            ({ rotation }) => new Vector3(rotation.x, rotation.y, rotation.z),
          );
        }

        this.setupMaterial();
      }
    }
  }

  public getVertices(): Nullable<Vector3[]> {
    return this.triangleVertices;
  }

  public getEdges(): Nullable<Vector3[]> {
    return this.triangleEdges;
  }

  public setVertices(vertices: Vector3[]): void {
    this.triangleVertices = vertices;
  }

  public setEdges(edges: Vector3[]): void {
    this.triangleEdges = edges;
  }

  public getTriangleMesh(): Nullable<AbstractMesh> {
    return this.triangleMesh;
  }

  public update(context?: {
    adjacentTriangleMesh: TriangleMesh;
    direction: number;
    onFlipEnd?: () => void;
  }): void {
    const nextState = this.currentState.update(context);

    if (nextState) {
      this.currentState = nextState;
    }
  }

  public flip({
    triangleMesh,
    direction,
    onFlipEnd,
  }: {
    triangleMesh: TriangleMesh;
    direction: number;
    onFlipEnd?: () => void;
  }): void {
    const context = {
      adjacentTriangleMesh: triangleMesh,
      direction,
      onFlipEnd,
    };
    this.update(context);
  }

  public getTriangle(): Triangle {
    return this.triangle;
  }

  public getScalingRatio(): number {
    return this.scalingRatio;
  }

  public computeObjSpaceAssetMeshVertices(): Vector3[] | undefined {
    if (this.triangle && this.triangleMesh) {
      const tr = this.triangle;
      const matrix = this.triangleMesh.computeWorldMatrix(true);
      const vertices = [
        Vector3.TransformCoordinates(tr.p1(), Matrix.Invert(matrix)),
        Vector3.TransformCoordinates(tr.p2(), Matrix.Invert(matrix)),
        Vector3.TransformCoordinates(tr.p3(), Matrix.Invert(matrix)),
      ];

      return vertices;
    }
    // eslint-disable-next-line no-console
    console.assert(this.triangleMesh && this.triangle, 'Asset not found');
    return undefined;
  }

  public computeObjSpaceVertices(): Vector3[] | undefined {
    if (this.triangle && this.triangleMesh) {
      const tr = this.triangle;
      const matrix = this.triangleMesh.computeWorldMatrix(true);
      const vertices = [
        Vector3.TransformCoordinates(tr.p1(), Matrix.Invert(matrix)).scale(
          this.getScalingRatio(),
        ),
        Vector3.TransformCoordinates(tr.p2(), Matrix.Invert(matrix)).scale(
          this.getScalingRatio(),
        ),
        Vector3.TransformCoordinates(tr.p3(), Matrix.Invert(matrix)).scale(
          this.getScalingRatio(),
        ),
      ];

      return vertices;
    }
    // eslint-disable-next-line no-console
    console.assert(this.triangle && this.triangleMesh, 'Asset not found');
    return undefined;
  }

  public computeObjSpaceEdges(vertices: Vector3[]): Vector3[] {
    const edges = vertices.map((v, i) =>
      v.subtract(vertices[(i + 1) % vertices.length]),
    );
    return edges;
  }

  private createNodesStructure(scene: Scene): void {
    if (this.triangleMesh) {
      const rootNode = scene.getNodeByName('root');
      const positionNode = new TransformNode(
        `positionNode${this.triangle.getId()}`,
      );
      positionNode.parent = rootNode;
      const rotationNode = new TransformNode(
        `rotationNode${this.triangle.getId()}`,
      );
      rotationNode.parent = positionNode;
      const flipNode = new TransformNode(`flipNode${this.triangle.getId()}`);
      flipNode.parent = rotationNode;
      const scalingNode = new TransformNode(
        `scalingNode${this.triangle.getId()}`,
      );
      flipNode.rotationQuaternion = Quaternion.Identity();

      scalingNode.parent = flipNode;
      this.triangleMesh.parent = scalingNode;

      this.scalingNodeInitialPosition = scalingNode.position;
    }
  }

  private setupPosition(scene: Scene, triangleMeshScalingRatio: number): void {
    const positionNode = scene.getNodeByName(
      `positionNode${this.triangle.getId()}`,
    );
    const rotationNode = scene.getNodeByName(
      `rotationNode${this.triangle.getId()}`,
    );
    const scalingNode = scene.getNodeByName(
      `scalingNode${this.triangle.getId()}`,
    );

    const triangleCenter = this.triangle.getCenterPoint();
    const direction = triangleCenter; // Center - origin

    const yawCorrection = 0;
    const pitchCorrection = math.angle90;
    const rollCorrection = 0;
    if (positionNode && rotationNode && scalingNode && this.triangleMesh) {
      (positionNode as TransformNode).setDirection(
        direction,
        yawCorrection,
        pitchCorrection,
        rollCorrection,
      );
      (rotationNode as TransformNode).position = new Vector3(
        0,
        direction.length(),
        0,
      );
      (scalingNode as TransformNode).scaling = new Vector3(
        triangleMeshScalingRatio,
        triangleMeshScalingRatio,
        triangleMeshScalingRatio,
      );
      const p1CenterVector = this.triangle.p1().subtract(triangleCenter);

      const angle = Vector3.GetAngleBetweenVectors(
        (rotationNode as TransformNode).forward,
        p1CenterVector,
        (rotationNode as TransformNode).up,
      );

      if (Math.abs(angle) > 0.05) {
        (rotationNode as TransformNode).rotate(this.triangleMesh.up, angle);
      } else if (DEBUG_RENDERING) {
        addAxisToScene({
          scene,
          size: 0.5,
          parent: rotationNode as TransformNode,
        });
        MeshBuilder.CreateLines('line', {
          points: [this.triangle.p1(), triangleCenter],
        });
      }
    }
  }

  public computeBonesRotationAngle({
    triangle,
  }: {
    triangle: Triangle;
  }): number[] {
    const triangleCenter = triangle.getCenterPoint();
    const p1CenterVector = triangle.p1().subtract(triangleCenter);
    const p2CenterVector = triangle.p2().subtract(triangleCenter);
    const p3CenterVector = triangle.p3().subtract(triangleCenter);

    const positionNode = this.scene.getNodeByName(
      `positionNode${this.getTriangle().getId()}`,
    );

    if (positionNode) {
      const angleP1ToP3 = Vector3.GetAngleBetweenVectors(
        p1CenterVector,
        p3CenterVector,
        (positionNode as TransformNode).up,
      );
      const angleP1ToP2 = Vector3.GetAngleBetweenVectors(
        p1CenterVector,
        p2CenterVector,
        (positionNode as TransformNode).up,
      );
      const deltaAngle1 = angleP1ToP3 - math.angle120;
      const deltaAngle2 = angleP1ToP2 + math.angle120;

      return [deltaAngle1, deltaAngle2, 0];
    }
    return [0, 0, 0];
  }

  public computeBonesDeformation(): Vector3[] {
    // eslint-disable-next-line no-console
    console.assert(
      this.triangleMesh && this.triangleMesh.skeleton,
      'Mesh and skeleton must exist',
    );
    if (this.triangleMesh && this.triangleMesh.skeleton) {
      const skeletonMesh = this.triangleMesh.skeleton;

      const bone1rotation = skeletonMesh.bones[0].rotation.clone();
      const bone2rotation = skeletonMesh.bones[1].rotation.clone();
      const bone3rotation = skeletonMesh.bones[2].rotation.clone();

      bone1rotation.y += this.bonesRotationAngle[0];
      bone2rotation.y += this.bonesRotationAngle[1];

      return [bone1rotation, bone2rotation, bone3rotation];
    }
    return [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
  }

  public computeBonesScaling(): number[] {
    const triangleCenter = this.triangle.getCenterPoint();
    const p1CenterVector = this.triangle.p1().subtract(triangleCenter);
    const p2CenterVector = this.triangle.p2().subtract(triangleCenter);
    const p3CenterVector = this.triangle.p3().subtract(triangleCenter);
    if (
      this.triangleMesh &&
      this.triangleMesh.skeleton &&
      this.equilateralTriangleRadius
    ) {
      const scaleBones = [
        p3CenterVector.length() / this.equilateralTriangleRadius,
        p2CenterVector.length() / this.equilateralTriangleRadius,
        p1CenterVector.length() / this.equilateralTriangleRadius,
      ];

      return scaleBones;
    }
    return [1, 1, 1];
  }

  public setupMaterial(): void {
    if (this.triangleMesh) {
      const material = new StandardMaterial(
        `meshMaterial${this.triangle.getId()}`,
        this.scene,
      );
      material.diffuseColor = this.triangle.getColor();
      material.backFaceCulling = false;
      material.alpha = 1;
      this.triangleMesh.material = material;
    }
  }

  public getAdjacentsVerticesMap(
    adjTriangle: Triangle,
  ): Record<string, number[]> {
    const trVertices = this.triangle.getVertices();
    const adjTrVertices = adjTriangle.getVertices();
    const adjacentsMap: Record<string, number[]> = {
      trAdjs: [],
      adjTrAdjs: [],
    };
    if (trVertices && adjTrVertices) {
      trVertices.forEach((trVertice: Vector3, indexTrVertice: number) => {
        adjTrVertices.forEach(
          (adjTrVertice: Vector3, indexAdjTrVertice: number) => {
            if (adjTrVertice.subtract(trVertice).length() < k_epsilon) {
              adjacentsMap.trAdjs.push(indexTrVertice);
              adjacentsMap.adjTrAdjs.push(indexAdjTrVertice);
            }
          },
        );
      });
    }
    return adjacentsMap;
  }

  public getTriangleMeshBonesIndices(verticeIndices: number[]): number[] {
    const bonesIndices: number[] = [];
    verticeIndices.forEach((k, i) => {
      switch (k) {
        case 0:
          bonesIndices[i] = 2;
          break;
        case 1:
          bonesIndices[i] = 1;
          break;
        case 2:
          bonesIndices[i] = 0;
          break;
        default:
      }
    });
    return bonesIndices;
  }

  public getTriangleMeshIndicesSum(verticeIndices: number[]): number {
    return verticeIndices.reduce((curr, prev) => curr + prev);
  }

  public getTriangleMeshFlipEdgeIndex(indicesSum: number): number {
    let flipEdgeIndex = 0;
    switch (indicesSum) {
      case 1:
        flipEdgeIndex = 0;
        break;
      case 2:
        flipEdgeIndex = 2;
        break;
      case 3:
        flipEdgeIndex = 1;
        break;
      default:
    }
    return flipEdgeIndex;
  }

  public getAngleBonesRotation(): number[] {
    return this.bonesRotationAngle;
  }

  public setAngleBonesRotation(rotations: number[]): void {
    this.bonesRotationAngle = rotations;
  }

  public reset(type: Type): void {
    const mesh = this.getTriangleMesh();
    if (mesh && mesh.skeleton) {
      mesh.skeleton.bones.map((b, i) => {
        if (this.skeletonBonesScaling) {
          b.setScale(this.skeletonBonesScaling[i]);
        }
        if (this.skeletonBonesRotation) {
          b.setRotation(this.skeletonBonesRotation[i]);
        }
        return undefined;
      });
    }
    const scalingNode = mesh?.parent as TransformNode;
    const flipNode = scalingNode.parent as TransformNode;
    scalingNode.position = this.scalingNodeInitialPosition;
    scalingNode.rotation.y = 0;
    flipNode.position = this.scalingNodeInitialPosition;
    flipNode.rotationQuaternion = new Quaternion(0, 0, 0, 1);

    this.triangle.setType(type);
    this.setupMaterial();
  }
}

export default TriangleMesh;
