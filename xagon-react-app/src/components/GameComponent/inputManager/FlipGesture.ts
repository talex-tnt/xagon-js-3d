import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  Matrix,
} from '@babylonjs/core';
import { k_epsilon } from 'constants/index';
import Triangle, { AdjacentTriangle, Type } from 'models/Triangle';
import TriangleMesh from 'rendering/TriangleMesh';
import { getAssetMesh } from 'utils/scene';
import Gesture from './Gesture';

interface GestureContext {
  scene: Scene;
  triangleMesh: AbstractMesh;
  scalingRatio: number;
  onFlipBegin: () => void;
}

class FlipGesture extends Gesture {
  private context: GestureContext;

  private firstTriangleMesh: Nullable<TriangleMesh>;

  private secondTriangleMesh: Nullable<TriangleMesh>;

  private firstType: Type;

  private secondType: Type;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
    this.firstType = -1;
    this.secondType = -1;
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
        Vector3.TransformCoordinates(tr.p1(), Matrix.Invert(matrix)).scale(
          this.context.scalingRatio,
        ),
        Vector3.TransformCoordinates(tr.p2(), Matrix.Invert(matrix)).scale(
          this.context.scalingRatio,
        ),
        Vector3.TransformCoordinates(tr.p3(), Matrix.Invert(matrix)).scale(
          this.context.scalingRatio,
        ),
      ];

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
            this.firstType = triangleMesh.getTriangle().getType();
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
              this.secondType = assetMesh.getTriangle().getType();
            }
          }

          if (this.secondTriangleMesh) {
            const secondTriangle = this.secondTriangleMesh.getTriangle();
            if (firstTriangle.isAdjacent(secondTriangle)) {
              let flipEnded1 = false;
              let flipEnded2 = false;

              this.firstTriangleMesh.flip({
                triangleMesh: this.secondTriangleMesh,
                direction: 1,
                onFlipEnd: () => {
                  flipEnded1 = true;
                  if (
                    flipEnded2 &&
                    this.firstTriangleMesh &&
                    this.secondTriangleMesh
                  ) {
                    this.firstTriangleMesh.reset(
                      this.secondTriangleMesh,
                      this.secondType,
                    );
                    this.secondTriangleMesh.reset(
                      this.firstTriangleMesh,
                      this.firstType,
                    );
                  }
                },
              });
              this.secondTriangleMesh.flip({
                triangleMesh: this.firstTriangleMesh,
                direction: -1,
                onFlipEnd: () => {
                  flipEnded2 = true;
                  if (
                    flipEnded1 &&
                    this.firstTriangleMesh &&
                    this.secondTriangleMesh
                  ) {
                    this.secondTriangleMesh.reset(
                      this.firstTriangleMesh,
                      this.firstType,
                    );
                    this.firstTriangleMesh.reset(
                      this.secondTriangleMesh,
                      this.secondType,
                    );
                  }
                },
              });

              this.context.onFlipBegin();
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
