import { Vector3 } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene';
import { k_epsilon } from 'constants/index';
import Triangle from 'models/Triangle';

const isDuplicated = (array: Triangle[], element: Triangle) =>
  array.find((e) => {
    if (e) {
      return e.getId() === element.getId();
    }
    return false;
  });

const hasPoint = (tr: Triangle, point: Vector3) =>
  tr && tr.getVertices().find((p) => p.subtract(point).length() < k_epsilon);

export const hexagonsVerify = (tr: Triangle): Array<Triangle[]> => {
  const hexagons: Array<Triangle[]> = [];
  let hexagon1: Triangle[] = [];
  let hexagon2: Triangle[] = [];
  let hexagon3: Triangle[] = [];

  const p1 = tr.p1();
  const p2 = tr.p2();
  const p3 = tr.p3();

  const adjsP1: Triangle[] = [];
  const adjsP2: Triangle[] = [];
  const adjsP3: Triangle[] = [];

  tr.getAdjacents()
    .filter((a, i) => i !== 1)
    .forEach((tr1) => {
      if (tr1) {
        adjsP1.push(tr1);
      }
    });
  tr.getAdjacents()
    .filter((a, i) => i !== 2)
    .forEach((tr1) => {
      if (tr1) {
        adjsP2.push(tr1);
      }
    });
  tr.getAdjacents()
    .filter((a, i) => i !== 0)
    .forEach((tr1) => {
      if (tr1) {
        adjsP3.push(tr1);
      }
    });

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

const createHexagon = (tr: Triangle, point: Vector3, adjs: Triangle[]) => {
  const hexagon: Triangle[] = [tr as Triangle];
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

export const hexagonsChangeType = (
  hexagons: Array<Triangle[]>,
  scene: Scene,
): void => {
  hexagons.forEach((hex: Triangle[]) => {
    hex.forEach((tr) => {
      if (tr) {
        const mesh = scene.getMeshByName(tr.getName());
        const trMesh = mesh && mesh.metadata.triangleMesh;
        tr.setType(Triangle.getRandomType());
        trMesh.setupMaterial();
      }
    });
  });
};
