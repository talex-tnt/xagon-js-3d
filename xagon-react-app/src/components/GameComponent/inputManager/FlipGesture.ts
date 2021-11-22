import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  MeshBuilder,
  Matrix,
} from '@babylonjs/core';
import TriangleMesh from 'rendering/TriangleMesh';
import { getAssetMesh } from 'utils/scene';
import Gesture from './Gesture';

interface GestureContext {
  scene: Scene;
  triangleMesh: AbstractMesh;
  scalingRatio: number;
  onFlip: () => void;
}

class FlipGesture extends Gesture {
  private context: GestureContext;

  private firstTriangleMesh: Nullable<TriangleMesh>;

  private secondTriangleMesh: Nullable<TriangleMesh>;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
  }

  public computeObjSpaceData(assetMesh: AbstractMesh):
    | {
        vertices: Vector3[];
        edges: Vector3[];
      }
    | undefined {
    if (assetMesh && assetMesh.skeleton) {
      const tr = assetMesh.metadata.triangleMesh.getTriangle();
      const matrix = assetMesh.getWorldMatrix();
      const vertices = [
        Vector3.TransformCoordinates(tr.p3(), Matrix.Invert(matrix)),
        Vector3.TransformCoordinates(tr.p2(), Matrix.Invert(matrix)),
        Vector3.TransformCoordinates(tr.p1(), Matrix.Invert(matrix)),
      ];

      // const firstPointEdgeObjSpace = Vector3.TransformCoordinates(
      //   firstTriangleWorldSpaceVertices[
      //     Number(firstTriangleVerticesIndices[0])
      //   ],
      //   Matrix.Invert(matrix),
      // );
      // const secondPointEdgeObjSpace = Vector3.TransformCoordinates(
      //   firstTriangleWorldSpaceVertices[
      //     Number(firstTriangleVerticesIndices[1])
      //   ],
      //   Matrix.Invert(matrix),
      // );
      const objSpaceVertices = assetMesh.skeleton.bones.map((bone) => {
        let vertex = bone
          .getDirection(this.context.triangleMesh.up)
          .scale(1 / 0.85);

        vertex = vertex.scale(Math.abs(bone.scaling.y));
        return vertex;
      });
      // const matrix = assetMesh.getWorldMatrix();
      // MeshBuilder.CreateLines('matr', {
      //   points: [
      //     Vector3.TransformCoordinates(objSpaceVertices[0], matrix),
      //     Vector3.TransformCoordinates(objSpaceVertices[1], matrix),
      //     Vector3.TransformCoordinates(objSpaceVertices[2], matrix),
      //     Vector3.TransformCoordinates(objSpaceVertices[0], matrix),
      //   ],
      // });

      const edges = vertices.map((v, i) =>
        v.subtract(vertices[(i + 1) % vertices.length]),
      );

      return { vertices, edges };
    }
    // eslint-disable-next-line no-console
    console.assert(typeof assetMesh === 'object', 'Asset not found');
    return undefined;
  }

  public onDown(pointerInfo: PointerInfo): void {
    const mesh = pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
    if (mesh) {
      const originalMesh = getAssetMesh({
        scene: this.context.scene,
        triangleMesh: mesh,
      });

      if (originalMesh) {
        const { triangleMesh } = originalMesh.metadata;
        if (triangleMesh) {
          const data = this.computeObjSpaceData(originalMesh);
          if (data) {
            triangleMesh.setVertices(data.vertices);
            triangleMesh.setEdges(data.edges);

            this.firstTriangleMesh = triangleMesh;
          }
        }
      }
    }
  }

  public onMove(): void {
    if (this.firstTriangleMesh) {
      const firstTriangle = this.firstTriangleMesh.getTriangle();

      const pickinfo = this.context.scene.pick(
        this.context.scene.pointerX,
        this.context.scene.pointerY,
      );

      if (
        pickinfo &&
        pickinfo.pickedMesh &&
        pickinfo.pickedMesh.metadata.triangle.getId() !== firstTriangle.getId()
      ) {
        const mesh = pickinfo.pickedMesh;

        if (mesh) {
          const originalMesh = getAssetMesh({
            scene: this.context.scene,
            triangleMesh: mesh,
          });
          if (originalMesh) {
            const assetMesh = originalMesh.metadata.triangleMesh;
            const data = this.computeObjSpaceData(originalMesh);
            if (data) {
              assetMesh.setVertices(data.vertices);
              assetMesh.setEdges(data.edges);

              this.secondTriangleMesh = assetMesh;
            }
          }

          if (this.secondTriangleMesh) {
            const secondTriangle = this.secondTriangleMesh.getTriangle();
            if (firstTriangle.isAdjacent(secondTriangle)) {
              this.firstTriangleMesh.onFlip({
                triangleMesh: this.secondTriangleMesh,
                direction: 1,
              });
              this.secondTriangleMesh.onFlip({
                triangleMesh: this.firstTriangleMesh,
                direction: -1,
              });
              this.context.onFlip();
            }
          }
        }
      }
    }
  }

  public onRelease(pointerInfo: PointerInfo): void {
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
  }
}

export default FlipGesture;
