import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  Vector2,
  Matrix,
} from '@babylonjs/core';
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

  private startPoint: Nullable<Vector2> = Vector2.Zero();

  private lastEventTime = 0;

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
      if (pointerInfo.event) {
        this.startPoint = new Vector2(pointerInfo.event.x, pointerInfo.event.y);
        this.lastEventTime = Date.now();
      }

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

      let isValidGesture = false;
      let gestureLength = 0;

      const now = Date.now();
      const deltaTime = now - this.lastEventTime;

      if (deltaTime > 20) {
        this.startPoint = new Vector2(
          this.context.scene.pointerX,
          this.context.scene.pointerY,
        );
      }

      const finalPoint = new Vector2(
        this.context.scene.pointerX,
        this.context.scene.pointerY,
      );
      if (finalPoint && this.startPoint) {
        gestureLength = this.startPoint.subtract(finalPoint).length();
      }

      if (deltaTime <= 20 && gestureLength > 30) {
        isValidGesture = true;
      }
      if (
        isValidGesture &&
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
              let flipEnded1 = false;
              let flipEnded2 = false;
              const swapType = (trM1: TriangleMesh, trM2: TriangleMesh) => {
                if (trM1 && trM2) {
                  const tr1 = trM1.getTriangle();
                  const tr2 = trM2.getTriangle();
                  const tr1Type = tr1.getType();
                  const tr2Type = tr2.getType();

                  trM1.reset(tr2Type);
                  trM2.reset(tr1Type);
                  const { icosahedron } = this.context.scene.metadata;
                  icosahedron.notifyTrianglesChanged([tr1, tr2]);
                }
              };

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
                    swapType(this.firstTriangleMesh, this.secondTriangleMesh);
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
                    swapType(this.firstTriangleMesh, this.secondTriangleMesh);
                  }
                },
              });

              this.context.onFlipBegin();
            }
          }
        }
      } else this.lastEventTime = Date.now();
    }
  }

  public onRelease(pointerInfo: PointerInfo): void {
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
  }
}

export default FlipGesture;
