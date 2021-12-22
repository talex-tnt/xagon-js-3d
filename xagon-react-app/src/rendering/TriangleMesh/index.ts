import Triangle, { Type } from 'models/Triangle';
import {
  AbstractMesh,
  Scene,
  TransformNode,
  Vector3,
  StandardMaterial,
  Nullable,
  Quaternion,
} from '@babylonjs/core';
import { math } from 'utils';
import { k_triangleAssetName } from 'constants/identifiers';
import { k_epsilon, k_triangleScale } from 'constants/index';
import EquilateralTriangleProvider from './EquilateralTriangleProvider';
import IMeshState from './State/IMeshState';
import MeshStateIdle from './State/MeshStateIdle';

class TriangleMesh {
  private scene: Scene;

  private triangle: Triangle;

  private triangleMesh: Nullable<AbstractMesh>;

  private triangleEdges: Nullable<Vector3[]> = null;

  private triangleVertices: Nullable<Vector3[]> = null;

  private vertices_Center_Vectors: Nullable<Vector3[]>;

  private scalingRatio: number;

  private skeletonScaling?: Vector3[];

  private scalingNodeInitialPosition: Vector3 = Vector3.Zero();

  private flipNodeInitialPosition: Vector3 = Vector3.Zero();

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
    this.vertices_Center_Vectors = null;
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

    const radiusEquilaterTriangle = equilateralTriangle
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

        this.setupDeformation({
          scene,
          originalMesh: mesh,
          triangle: this.triangle,
        });

        this.setupBonesScaling(radiusEquilaterTriangle);

        const thisMesh = this.getTriangleMesh();
        if (thisMesh && thisMesh.skeleton) {
          this.skeletonScaling = thisMesh.skeleton.bones.map(
            (b) => new Vector3(b.scaling.x, b.scaling.y, b.scaling.z),
          );

          this.setupMaterial();
        }
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

  public getVertices_Center_Vectors(): Nullable<Vector3[]> {
    return this.vertices_Center_Vectors;
  }

  public update(): void {
    const nextState = this.currentState.update();
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
    this.currentState.update(context);
  }

  public getTriangle(): Triangle {
    return this.triangle;
  }

  public getScalingRatio(): number {
    return this.scalingRatio;
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
      this.flipNodeInitialPosition = flipNode.position;
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
        (positionNode as TransformNode).forward,
        p1CenterVector,
        (positionNode as TransformNode).up,
      );

      (rotationNode as TransformNode).rotate(this.triangleMesh.up, angle);
    }
  }

  public setupDeformation({
    scene,
    originalMesh,
    triangle,
  }: {
    scene: Scene;
    originalMesh: AbstractMesh;
    triangle: Triangle;
  }): void {
    const triangleCenter = triangle.getCenterPoint();
    const p1CenterVector = triangle.p1().subtract(triangleCenter);
    const p2CenterVector = triangle.p2().subtract(triangleCenter);
    const p3CenterVector = triangle.p3().subtract(triangleCenter);
    this.vertices_Center_Vectors = [
      p1CenterVector,
      p2CenterVector,
      p3CenterVector,
    ];
    const positionNode = scene.getNodeByName(`positionNode${triangle.getId()}`);

    if (originalMesh.skeleton && this.triangleMesh && positionNode) {
      this.triangleMesh.skeleton = originalMesh.skeleton.clone(
        `skeleton${triangle.getId()}`,
      );
      const skeletonMesh = this.triangleMesh.skeleton;

      const rotationBone1 = skeletonMesh.bones[0].rotation;
      const rotationBone2 = skeletonMesh.bones[1].rotation;

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

      rotationBone1.y += angleP1ToP3 - math.angle120;
      rotationBone2.y += angleP1ToP2 + math.angle120;
      skeletonMesh.bones[0].setRotation(rotationBone1);
      skeletonMesh.bones[1].setRotation(rotationBone2);
    }
  }

  public setupBonesScaling(radiusEquilaterTriangle: number): void {
    const triangleCenter = this.triangle.getCenterPoint();
    const p1CenterVector = this.triangle.p1().subtract(triangleCenter);
    const p2CenterVector = this.triangle.p2().subtract(triangleCenter);
    const p3CenterVector = this.triangle.p3().subtract(triangleCenter);
    if (
      this.triangleMesh &&
      this.triangleMesh.skeleton &&
      radiusEquilaterTriangle
    ) {
      const scaleBones = [
        p3CenterVector.length() / radiusEquilaterTriangle,
        p2CenterVector.length() / radiusEquilaterTriangle,
        p1CenterVector.length() / radiusEquilaterTriangle,
      ];

      this.triangleMesh.skeleton.bones.map((bone, index) =>
        bone.scale(1, scaleBones[index], 1),
      );
    }
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
  ): Record<number, number> {
    const trVertices = this.triangle.getVertices();
    const adjTrVertices = adjTriangle.getVertices();
    const adjacentsMap: Record<number, number> = {};
    if (trVertices && adjTrVertices) {
      trVertices.forEach((trVertice: Vector3, indexTrVertice: number) => {
        adjTrVertices.forEach(
          (adjTrVertice: Vector3, indexAdjTrVertice: number) => {
            if (adjTrVertice.subtract(trVertice).length() < k_epsilon) {
              adjacentsMap[indexTrVertice] = indexAdjTrVertice;
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

  public reset(type: Type): void {
    const mesh = this.getTriangleMesh();
    if (mesh && mesh.skeleton) {
      mesh.skeleton.bones.map(
        (b, i) => this.skeletonScaling && b.setScale(this.skeletonScaling[i]),
      );
    }
    const scalingNode = mesh?.parent as TransformNode;
    const flipNode = scalingNode.parent as TransformNode;
    scalingNode.position = this.scalingNodeInitialPosition;
    flipNode.position = this.scalingNodeInitialPosition;
    flipNode.rotationQuaternion = new Quaternion(0, 0, 0, 1);

    this.triangle.setType(type);
    this.setupMaterial();
  }
}

export default TriangleMesh;
