import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  MeshBuilder,
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
      const objSpaceVertices = assetMesh.skeleton.bones.map((bone) => {
        const vertex = bone
          .getDirection(this.context.triangleMesh.up)
          .scale(this.context.scalingRatio);

        // console.log(vertex, assetMesh.metadata.triangleMesh.getTriangle().p2());

        // console.log('PRE', vertex.length());
        // console.log(bone.scaling);

        vertex.x *= 1 / bone.scaling.x;
        vertex.y *= 1 / bone.scaling.y;
        vertex.z *= 1 / bone.scaling.z;
        // vertex = vertex.scale(Math.abs(bone.scaling.y));

        // console.log('POST', vertex.length());

        return vertex;
      });

      const edges = objSpaceVertices.map((v, i) =>
        v.subtract(objSpaceVertices[(i + 1) % objSpaceVertices.length]),
      );

      return { vertices: objSpaceVertices, edges };
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
              // const types = {
              //   first: this.firstTriangleMesh.getTriangle().getType(),
              //   second: this.secondTriangleMesh.getTriangle().getType(),
              // };

              // this.firstTriangleMesh.getTriangle().setType(types.second);
              // this.secondTriangleMesh.getTriangle().setType(types.first);
            }
          }
        }
      }
    }
  }

  public onRelease(pointerInfo: PointerInfo): void {
    // eslint-disable-next-line no-console
    this.firstTriangleMesh = null;
    this.secondTriangleMesh = null;
  }
}

export default FlipGesture;
