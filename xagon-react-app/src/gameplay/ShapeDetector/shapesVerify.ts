import { Vector3 } from '@babylonjs/core';
import { Nullable } from '@babylonjs/core/types';
import Triangle from 'models/Triangle';
import { isDuplicated, hasPoint, haveSameType } from 'gameplay/utils';

export const shapesVerify = (
  triangles: Triangle[],
): Nullable<Triangle[]>[][] => {
  const shapesList = triangles.map((tr) => {
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

    return [
      { pivotPoint: tr.p1(), adjsPivotPoint: adjs[1] },
      { pivotPoint: tr.p2(), adjsPivotPoint: adjs[2] },
      { pivotPoint: tr.p3(), adjsPivotPoint: adjs[0] },
    ]
      .map(({ pivotPoint, adjsPivotPoint }) =>
        findHexagon(tr, pivotPoint, adjsPivotPoint),
      )
      .filter((hex) => !!hex);
  });
  return shapesList;
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
