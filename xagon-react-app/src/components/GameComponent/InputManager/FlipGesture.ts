import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector2,
  Vector3,
} from '@babylonjs/core';
import { k_gestureLength, k_gestureDeltaTimeThreshold } from 'game-constants';
import TriangleMesh from 'rendering/TriangleMesh';
import { getAssetMesh } from 'utils/scene';
import Gesture from './Gesture';

interface GestureContext {
  scene: Scene;
  triangleMesh: AbstractMesh;
  onFlipEnded: () => void;
}

export enum Direction {
  Up = 1,
  Down,
}

class FlipGesture extends Gesture {
  private context: GestureContext;

  private firstTriangleMesh: Nullable<TriangleMesh>;

  private secondTriangleMesh: Nullable<TriangleMesh>;

  private startPoint: Vector2 = Vector2.Zero();

  private lastEventTimestamp = 0;

  public constructor(context: GestureContext) {
    super();
    this.context = context;
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
  }

  public onDown(pointerInfo: PointerInfo): void {
    const mesh = pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;

    if (pointerInfo.event) {
      this.startPoint = new Vector2(pointerInfo.event.x, pointerInfo.event.y);
      this.lastEventTimestamp = Date.now();
    }
    if (mesh) {
      this.firstTriangleMesh = this.getTriangleMesh(mesh);
    }
  }

  public onMove(pointerInfo: PointerInfo): void {
    const pickinfo = this.context.scene.pick(
      this.context.scene.pointerX,
      this.context.scene.pointerY,
    );
    console.log('pointerInfo', pointerInfo);
    console.log('pickInfo', pickinfo);

    if (pickinfo && pointerInfo.event.pressure !== 0) {
      const mesh = pickinfo.pickedMesh;

      if (!this.firstTriangleMesh && mesh) {
        this.firstTriangleMesh = this.getTriangleMesh(mesh);
        this.startPoint = new Vector2(
          this.context.scene.pointerX,
          this.context.scene.pointerY,
        );
        this.lastEventTimestamp = Date.now();
      }

      if (this.firstTriangleMesh) {
        const firstTriangle = this.firstTriangleMesh.getTriangle();

        const now = Date.now();
        const deltaTime = now - this.lastEventTimestamp;

        if (deltaTime > k_gestureDeltaTimeThreshold) {
          this.startPoint = new Vector2(
            this.context.scene.pointerX,
            this.context.scene.pointerY,
          );
        } else {
          const finalPoint = new Vector2(
            this.context.scene.pointerX,
            this.context.scene.pointerY,
          );

          const gestureLength = this.startPoint.subtract(finalPoint).length();
          const isValidGesture = gestureLength > k_gestureLength;

          if (isValidGesture) {
            if (
              mesh &&
              mesh.metadata &&
              mesh.metadata.triangle &&
              mesh.metadata.triangle.getId() !== firstTriangle.getId()
            ) {
              const assetMesh = this.getTriangleMesh(mesh);

              if (assetMesh) {
                const assetMeshID = assetMesh.getTriangle().getId();

                const isAdjacent = !!this.firstTriangleMesh
                  .getTriangle()
                  .getAdjacents()
                  .find((a) => a?.getId() === assetMeshID);

                if (isAdjacent) {
                  this.secondTriangleMesh = assetMesh;
                }
              }

              if (this.secondTriangleMesh) {
                const secondTriangle = this.secondTriangleMesh.getTriangle();
                if (firstTriangle.isAdjacent(secondTriangle)) {
                  let flipEnded = false;
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
                    direction: Direction.Up,
                    onFlipEnd: () => {
                      if (
                        flipEnded &&
                        this.firstTriangleMesh &&
                        this.secondTriangleMesh
                      ) {
                        swapType(
                          this.firstTriangleMesh,
                          this.secondTriangleMesh,
                        );
                        this.context.onFlipEnded();
                      }
                      flipEnded = true;
                    },
                  });
                  this.secondTriangleMesh.flip({
                    triangleMesh: this.firstTriangleMesh,
                    direction: Direction.Down,
                    onFlipEnd: () => {
                      if (
                        flipEnded &&
                        this.firstTriangleMesh &&
                        this.secondTriangleMesh
                      ) {
                        swapType(
                          this.firstTriangleMesh,
                          this.secondTriangleMesh,
                        );
                        this.context.onFlipEnded();
                      }
                      flipEnded = true;
                    },
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  public onRelease(pointerInfo: PointerInfo): void {
    //
  }

  public getTriangleMesh(mesh: AbstractMesh): Nullable<TriangleMesh> {
    const originalMesh = getAssetMesh({
      scene: this.context.scene,
      triangleMesh: mesh,
    });

    if (originalMesh) {
      const { triangleMesh } = originalMesh.metadata;
      if (triangleMesh) {
        const vertices = triangleMesh.computeObjSpaceVertices();
        const scalingRatio = triangleMesh.getScalingRatio();
        const scaledVertices = vertices.map((v: Vector3) =>
          v.scale(scalingRatio),
        );
        const edges = triangleMesh.computeObjSpaceEdges(scaledVertices);

        if (scaledVertices && edges) {
          triangleMesh.setVertices(scaledVertices);
          triangleMesh.setEdges(edges);

          return triangleMesh;
        }
      }
    }
    return null;
  }
}

export default FlipGesture;
