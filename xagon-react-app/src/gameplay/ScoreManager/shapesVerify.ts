import { Vector3 } from '@babylonjs/core';
import { Nullable } from '@babylonjs/core/types';
import Triangle from 'models/Triangle';
import { isDuplicated, hasPoint, haveSameType } from 'gameplay/utils/utils';

export const shapesVerify = (
  triangles: Triangle[],
): Array<Array<Triangle[]>> => {
  const shapes = triangles.map((tr) => {
    const hexagons: Array<Triangle[]> = [];

    const adjs: Array<Triangle[]> = [[], [], []];

    adjs.forEach((adj, index) => {
      tr.getAdjacents()
        .filter((a, i) => i !== index)
        .forEach((tr1) => {
          if (tr1) {
            adj.push(tr1);
          }
        });
    });

    const hexagon1 = findHexagon(tr, tr.p1(), adjs[1]);
    const hexagon2 = findHexagon(tr, tr.p2(), adjs[2]);
    const hexagon3 = findHexagon(tr, tr.p3(), adjs[0]);

    if (hexagon1) {
      hexagons.push(hexagon1);
    }
    if (hexagon2) {
      hexagons.push(hexagon2);
    }
    if (hexagon3) {
      hexagons.push(hexagon3);
    }
    return hexagons;
  });
  return shapes;
};

const findHexagon = (
  tr: Triangle,
  point: Vector3,
  adjs: Triangle[],
): Nullable<Triangle[]> => {
  const shape: Triangle[] = [tr];
  if (
    adjs[0] &&
    adjs[1] &&
    haveSameType(tr, adjs[0]) &&
    haveSameType(tr, adjs[1])
  ) {
    shape.push(adjs[0]);
    shape.push(adjs[1]);
    adjs.forEach((adj) => {
      const adjs2 = adj
        ?.getAdjacents()
        .find(
          (adj2) =>
            adj2?.getType() === tr.getType() &&
            adj2.getId() !== tr.getId() &&
            hasPoint(adj2, point),
        );

      if (adjs2) {
        if (!isDuplicated(shape, adjs2)) {
          shape.push(adjs2);
        }

        if (adj && hasPoint(adjs2, point)) {
          const adjs3 = adjs2
            ?.getAdjacents()
            .find(
              (adj3) =>
                adj3?.getType() === tr.getType() &&
                adj3.getId() !== adj.getId() &&
                hasPoint(adj3, point),
            );

          if (adjs3 && hasPoint(adjs3, point)) {
            if (!isDuplicated(shape, adjs3)) {
              shape.push(adjs3);
            }
          }
        }
      }
    });
  }
  if (shape.length === 6) {
    const hexagon = shape;
    return hexagon;
  }

  return null;
};
