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

class TriangleMesh {
  private triangle: Triangle;

  private triangleMesh: Nullable<AbstractMesh>;

  public constructor({
    scene,
    triangle,
    radiusEquilaterTriangle,
    triangleMeshScalingRatio,
  }: {
    scene: Scene;
    triangle: Triangle;
    radiusEquilaterTriangle: number;
    triangleMeshScalingRatio: number;
  }) {
    this.triangle = triangle;
    this.triangleMesh = null;
    const mesh = scene.getMeshByName(k_triangleAssetName);

    if (mesh) {
      const triangleMesh = mesh.clone(triangle.getName(), mesh);
      this.triangleMesh = triangleMesh;
      if (triangleMesh) {
        triangleMesh.metadata = { triangleMesh: this };

        this.createNodesStructure(scene);

        this.setTriangleMeshPosition(scene, triangleMeshScalingRatio);

        this.setTriangleMeshDeformation({
          scene,
          originalMesh: mesh,
          radiusEquilaterTriangle,
        });

        this.setTriangleMeshMaterial(scene);
      }
    }
  }

  public getTriangle(): Triangle {
    return this.triangle;
  }

  public createNodesStructure(scene: Scene): void {
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

  public setTriangleMeshPosition(
    scene: Scene,
    triangleMeshScalingRatio: number,
  ): void {
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

  public setTriangleMeshDeformation({
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

  public setTriangleMeshMaterial(scene: Scene): void {
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
