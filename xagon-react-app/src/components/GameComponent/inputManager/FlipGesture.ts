import {
  AbstractMesh,
  PointerInfo,
  Scene,
  Nullable,
  Vector3,
  Matrix,
} from '@babylonjs/core';
import { k_epsilon } from 'constants/index';
import Triangle, { AdjacentTriangle } from 'models/Triangle';
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
              let flipEnded1 = false;
              let flipEnded2 = false;

              const swapType = (trM1?: TriangleMesh, trM2?: TriangleMesh) => {
                if (trM1 && trM2) {
                  const trFirst = trM1.getTriangle();
                  const trSecond = trM2.getTriangle();
                  const tr1Type = trFirst.getType();
                  trFirst.setType(trSecond.getType());
                  trSecond.setType(tr1Type);

                  const hasPoint = (tr: AdjacentTriangle, point: Vector3) =>
                    tr &&
                    tr
                      .getVertices()
                      .find((p) => p.subtract(point).length() < k_epsilon);

                  const hasDuplicates = (
                    array: Array<Triangle>,
                    element: Triangle,
                  ) => array.find((e) => e.getId() === element.getId());

                  // hexagon tr1
                  const hexagonCompleted = (
                    first: TriangleMesh,
                    second: TriangleMesh,
                  ) => {
                    const tr1 = first.getTriangle();
                    const tr2 = second.getTriangle();
                    const hexagon: Triangle[] = [];

                    const map = Object.keys(first.getAdjacentsVerticesMap(tr2));

                    const notAdjacentIndex = [0, 1, 2].filter(
                      (index) =>
                        index !== Number(map[0]) && index !== Number(map[1]),
                    );

                    const notAdjacentPoint =
                      notAdjacentIndex &&
                      tr1.getVertices()[notAdjacentIndex[0]];

                    let verifedDirections = 0;
                    hexagon.push(tr1);

                    const adjs = tr1
                      .getAdjacents()
                      .filter(
                        (adj) =>
                          adj?.getId() !== tr2.getId() &&
                          adj?.getType() === tr1.getType(),
                      );

                    if (adjs[0] && adjs[1] && adjs.length === 2) {
                      hexagon.push(adjs[0]);
                      hexagon.push(adjs[1]);
                      adjs.forEach((a) => {
                        const adjs2 = a
                          ?.getAdjacents()
                          .find(
                            (adj2) =>
                              adj2?.getType() === tr1.getType() &&
                              adj2.getId() !== tr1.getId() &&
                              hasPoint(adj2, notAdjacentPoint),
                          );

                        if (adjs2) {
                          if (!hasDuplicates(hexagon, adjs2)) {
                            hexagon.push(adjs2);
                          }

                          if (a && hasPoint(adjs2, notAdjacentPoint)) {
                            const adjs3 = adjs2
                              ?.getAdjacents()
                              .find(
                                (adj3) =>
                                  adj3?.getType() === tr1.getType() &&
                                  adj3.getId() !== a.getId() &&
                                  hasPoint(adj3, notAdjacentPoint),
                              );

                            if (adjs3 && hasPoint(adjs3, notAdjacentPoint)) {
                              if (
                                verifedDirections === 0 &&
                                !hasDuplicates(hexagon, adjs3)
                              ) {
                                hexagon.push(adjs3);
                              }
                              verifedDirections += 1;
                            }
                          }
                        }
                      });
                    }

                    if (verifedDirections === 2 && hexagon.length === 6) {
                      return true;
                    }
                    return false;
                  };

                  if (hexagonCompleted(trM1, trM2)) {
                    console.log('winner');
                  }
                  if (hexagonCompleted(trM2, trM1)) {
                    console.log('winner');
                  }

                  // {
                  //   const hexagon: Triangle[] = [];

                  //   const map = Object.keys(trM1.getAdjacentsVerticesMap(tr2));

                  //   const notAdjacentIndex = [0, 1, 2].filter(
                  //     (index) =>
                  //       index !== Number(map[0]) && index !== Number(map[1]),
                  //   );

                  //   const notAdjacentPoint =
                  //     notAdjacentIndex &&
                  //     tr1.getVertices()[notAdjacentIndex[0]];

                  //   let verifedDirections = 0;
                  //   hexagon.push(tr1);

                  //   const adjs = tr1
                  //     .getAdjacents()
                  //     .filter(
                  //       (adj) =>
                  //         adj?.getId() !== tr2.getId() &&
                  //         adj?.getType() === tr1.getType(),
                  //     );

                  //   if (adjs[0] && adjs[1] && adjs.length === 2) {
                  //     hexagon.push(adjs[0]);
                  //     hexagon.push(adjs[1]);
                  //     adjs.forEach((a) => {
                  //       const adjs2 = a
                  //         ?.getAdjacents()
                  //         .find(
                  //           (adj2) =>
                  //             adj2?.getType() === tr1.getType() &&
                  //             adj2.getId() !== tr1.getId() &&
                  //             hasPoint(adj2, notAdjacentPoint),
                  //         );

                  //       if (adjs2) {
                  //         if (!hasDuplicates(hexagon, adjs2)) {
                  //           hexagon.push(adjs2);
                  //         }

                  //         if (a && hasPoint(adjs2, notAdjacentPoint)) {
                  //           const adjs3 = adjs2
                  //             ?.getAdjacents()
                  //             .find(
                  //               (adj3) =>
                  //                 adj3?.getType() === tr1.getType() &&
                  //                 adj3.getId() !== a.getId() &&
                  //                 hasPoint(adj3, notAdjacentPoint),
                  //             );

                  //           if (adjs3 && hasPoint(adjs3, notAdjacentPoint)) {
                  //             if (
                  //               verifedDirections === 0 &&
                  //               !hasDuplicates(hexagon, adjs3)
                  //             ) {
                  //               hexagon.push(adjs3);
                  //             }
                  //             verifedDirections += 1;
                  //           }
                  //         }
                  //       }
                  //     });
                  //   }

                  //   if (verifedDirections === 2 && hexagon.length === 6) {
                  //     console.log('WINNER');
                  //   }
                  // }

                  // hexagon tr2
                  // {
                  //   const hexagon: Triangle[] = [];
                  //   const map = Object.keys(trM2.getAdjacentsVerticesMap(tr1));

                  //   const notAdjacentIndex = [0, 1, 2].filter(
                  //     (index) =>
                  //       index !== Number(map[0]) && index !== Number(map[1]),
                  //   );

                  //   const notAdjacentPoint =
                  //     notAdjacentIndex &&
                  //     tr2.getVertices()[notAdjacentIndex[0]];

                  //   let verifedDirections = 0;
                  //   hexagon.push(tr2);

                  //   const adjs = tr2
                  //     .getAdjacents()
                  //     .filter(
                  //       (adj) =>
                  //         adj?.getId() !== tr1.getId() &&
                  //         adj?.getType() === tr2.getType(),
                  //     );

                  //   if (adjs[0] && adjs[1] && adjs.length === 2) {
                  //     hexagon.push(adjs[0]);
                  //     hexagon.push(adjs[1]);
                  //     adjs.forEach((a) => {
                  //       const adjs2 = a
                  //         ?.getAdjacents()
                  //         .find(
                  //           (adj2) =>
                  //             adj2?.getType() === tr2.getType() &&
                  //             adj2.getId() !== tr2.getId() &&
                  //             hasPoint(adj2, notAdjacentPoint),
                  //         );

                  //       if (adjs2) {
                  //         if (!hasDuplicates(hexagon, adjs2)) {
                  //           hexagon.push(adjs2);
                  //         }

                  //         if (a && hasPoint(adjs2, notAdjacentPoint)) {
                  //           const adjs3 = adjs2
                  //             ?.getAdjacents()
                  //             .find(
                  //               (adj3) =>
                  //                 adj3?.getType() === tr2.getType() &&
                  //                 adj3.getId() !== a.getId() &&
                  //                 hasPoint(adj3, notAdjacentPoint),
                  //             );

                  //           if (adjs3 && hasPoint(adjs3, notAdjacentPoint)) {
                  //             if (
                  //               verifedDirections === 0 &&
                  //               !hasDuplicates(hexagon, adjs3)
                  //             ) {
                  //               hexagon.push(adjs3);
                  //             }
                  //             verifedDirections += 1;
                  //           }
                  //         }
                  //       }
                  //     });
                  //   }

                  //   if (verifedDirections === 2 && hexagon.length === 6) {
                  //     console.log('WINNER');
                  //   }
                  // }
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
                    this.firstTriangleMesh.setupMaterial(this.context.scene);
                    this.secondTriangleMesh.setupMaterial(this.context.scene);
                    this.firstTriangleMesh.reset();
                    this.secondTriangleMesh.reset();
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
                    this.firstTriangleMesh.setupMaterial(this.context.scene);
                    this.secondTriangleMesh.setupMaterial(this.context.scene);
                    this.secondTriangleMesh.reset();
                    this.firstTriangleMesh.reset();
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
