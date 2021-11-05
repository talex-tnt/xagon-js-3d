import Triangle from 'models/Triangle';
import {
  AbstractMesh,
  Scene,
  TransformNode,
  Vector3,
  StandardMaterial,
  Nullable,
} from '@babylonjs/core';
import { math } from 'utils';
import { k_triangleAssetName } from 'constants/identifiers';
import EquilateralTriangleProvider from './EquilateralTriangleProvider';
import IMeshState from './State/IMeshState';
import MeshStateIdle from './State/MeshStateIdle';

class TriangleMesh {
  private triangle: Triangle;

  private triangleMesh: Nullable<AbstractMesh>;

  private triangleEdges: Nullable<Vector3[]> = null;

  private triangleVertices: Nullable<Vector3[]> = null;

  private scalingRatio: number;

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
    this.currentState = new MeshStateIdle();
    this.triangle = triangle;
    this.triangleMesh = null;

    const TRIANGLE_RADIUS = 1;
    const TRIANGLE_SIDE = TRIANGLE_RADIUS * (3 / Math.sqrt(3));
    const TRIANGLE_SCALE = 0.85;

    const equilateralTriangle =
      equilateralTriangleProvider.findEquilateralTriangle();

    const triangleEdgeLength = equilateralTriangle
      .p1()
      .subtract(equilateralTriangle.p2())
      .length();
    this.scalingRatio =
      (1 / TRIANGLE_SIDE) * triangleEdgeLength * TRIANGLE_SCALE;

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
          radiusEquilaterTriangle,
        });

        this.setupMaterial(scene);
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

  public update(): void {
    const nextState = this.currentState.update();
    if (nextState) {
      this.currentState = nextState;
    }
  }

  public onFlip(triangleMesh: TriangleMesh): void {
    this.currentState.onFlip(triangleMesh);
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
      scalingNode.parent = flipNode;
      this.triangleMesh.parent = scalingNode;
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

  private setupDeformation({
    scene,
    originalMesh,
    radiusEquilaterTriangle,
  }: {
    scene: Scene;
    originalMesh: AbstractMesh;
    radiusEquilaterTriangle: number;
  }): void {
    const triangleCenter = this.triangle.getCenterPoint();
    const p1CenterVector = this.triangle.p1().subtract(triangleCenter);
    const p2CenterVector = this.triangle.p2().subtract(triangleCenter);
    const p3CenterVector = this.triangle.p3().subtract(triangleCenter);
    const positionNode = scene.getNodeByName(
      `positionNode${this.triangle.getId()}`,
    );

    if (originalMesh.skeleton && this.triangleMesh && positionNode) {
      this.triangleMesh.skeleton = originalMesh.skeleton.clone(
        `skeleton${this.triangle.getId()}`,
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

      if (radiusEquilaterTriangle) {
        const scaleBones = [
          p3CenterVector.length() / radiusEquilaterTriangle,
          p2CenterVector.length() / radiusEquilaterTriangle,
          p1CenterVector.length() / radiusEquilaterTriangle,
        ];

        skeletonMesh.bones.map((bone, index) =>
          bone.scale(1, scaleBones[index], 1),
        );
      }
    }
  }

  private setupMaterial(scene: Scene): void {
    if (this.triangleMesh) {
      const material = new StandardMaterial('cloneMaterial', scene);
      material.diffuseColor = this.triangle.getColor();
      material.backFaceCulling = false;
      material.alpha = 1;
      this.triangleMesh.material = material;
    }
  }
}

export default TriangleMesh;
