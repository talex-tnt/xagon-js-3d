import { Vector3 } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene';
import { k_epsilon } from 'constants/index';
import Triangle, { AdjacentTriangle } from 'models/Triangle';

export const hexagonsVerify = (tr1: Triangle, scene: Scene): void => {
  const hexagons: Array<AdjacentTriangle[]> = hexagonsCompleted(tr1);

  if (hexagons) {
    hexagons.forEach((hex) => {
      hex.forEach((tr) => {
        if (tr) {
          const mesh = scene.getMeshByName(tr.getName());
          const trMesh = mesh && mesh.metadata.triangleMesh;
          tr.setType(Triangle.getRandomType());
          trMesh.setupMaterial();
        }
      });
    });
  }
};

const isDuplicated = (
  array: Triangle[] | AdjacentTriangle[],
  element: Triangle,
) =>
  array.find((e) => {
    if (e) {
      return e.getId() === element.getId();
    }
    return false;
  });

const hasPoint = (tr: AdjacentTriangle, point: Vector3) =>
  tr && tr.getVertices().find((p) => p.subtract(point).length() < k_epsilon);

const hexagonsCompleted = (tr: Triangle) => {
  const hexagons: Array<AdjacentTriangle[]> = [];
  let hexagon1: AdjacentTriangle[] = [];
  let hexagon2: AdjacentTriangle[] = [];
  let hexagon3: AdjacentTriangle[] = [];

  const p1 = tr.p1();
  const p2 = tr.p2();
  const p3 = tr.p3();

  const adjsP1 = tr.getAdjacents().filter((a, i) => i !== 1);
  const adjsP2 = tr.getAdjacents().filter((a, i) => i !== 2);
  const adjsP3 = tr.getAdjacents().filter((a, i) => i !== 0);

  hexagon1 = createHexagon(tr, p1, adjsP1);
  hexagon2 = createHexagon(tr, p2, adjsP2);
  hexagon3 = createHexagon(tr, p3, adjsP3);

  if (hexagon1.length === 6) {
    hexagons.push(hexagon1);
  }
  if (hexagon2.length === 6) {
    hexagons.push(hexagon2);
  }
  if (hexagon3.length === 6) {
    hexagons.push(hexagon3);
  }
  return hexagons;
};

const haveSameType = (tr1: Triangle, tr2: Triangle) => {
  if (tr1.getType() === tr2.getType()) {
    return true;
  }
  return false;
};

const createHexagon = (
  tr: Triangle,
  point: Vector3,
  adjs: AdjacentTriangle[],
) => {
  const hexagon: AdjacentTriangle[] = [tr as AdjacentTriangle];
  if (
    adjs[0] &&
    adjs[1] &&
    haveSameType(tr, adjs[0]) &&
    haveSameType(tr, adjs[1])
  ) {
    hexagon.push(adjs[0]);
    hexagon.push(adjs[1]);
    adjs.forEach((a) => {
      const adjs2 = a
        ?.getAdjacents()
        .find(
          (adj2) =>
            adj2?.getType() === tr.getType() &&
            adj2.getId() !== tr.getId() &&
            hasPoint(adj2, point),
        );

      if (adjs2) {
        if (!isDuplicated(hexagon, adjs2)) {
          hexagon.push(adjs2);
        }

        if (a && hasPoint(adjs2, point)) {
          const adjs3 = adjs2
            ?.getAdjacents()
            .find(
              (adj3) =>
                adj3?.getType() === tr.getType() &&
                adj3.getId() !== a.getId() &&
                hasPoint(adj3, point),
            );

          if (adjs3 && hasPoint(adjs3, point)) {
            if (!isDuplicated(hexagon, adjs3)) {
              hexagon.push(adjs3);
            }
          }
        }
      }
    });
  }

  return hexagon;
};
