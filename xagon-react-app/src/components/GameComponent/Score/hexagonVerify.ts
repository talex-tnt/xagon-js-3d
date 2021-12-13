import { Vector3 } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene';
import { k_epsilon } from 'constants/index';
import Triangle, { AdjacentTriangle, Type } from 'models/Triangle';
import TriangleMesh from 'rendering/TriangleMesh';

export const hexagonVerify = (
  trM1: TriangleMesh,
  trM2: TriangleMesh,
  scene: Scene,
): void => {
  const hexagon = hexagonCompleted(trM1, trM2);

  if (hexagon) {
    hexagon.forEach((tr) => {
      const mesh = scene.getMeshByName(tr.getName());
      const trMesh = mesh && mesh.metadata.triangleMesh;
      tr.setType(Triangle.getRandomType());
      trMesh.setupMaterial();
    });
  }
};

const isDuplicated = (array: Array<Triangle>, element: Triangle) =>
  array.find((e) => e.getId() === element.getId());

const hasPoint = (tr: AdjacentTriangle, point: Vector3) =>
  tr && tr.getVertices().find((p) => p.subtract(point).length() < k_epsilon);

const hexagonCompleted = (first: TriangleMesh, second: TriangleMesh) => {
  const tr1 = first.getTriangle();
  const tr2 = second.getTriangle();
  const hexagon: Triangle[] = [];

  const map = Object.keys(first.getAdjacentsVerticesMap(tr2));

  const notAdjacentIndex = [0, 1, 2].filter(
    (index) => index !== Number(map[0]) && index !== Number(map[1]),
  );

  const notAdjacentPoint =
    notAdjacentIndex && tr1.getVertices()[notAdjacentIndex[0]];

  hexagon.push(tr1);

  const adjs = tr1
    .getAdjacents()
    .filter(
      (adj) => adj?.getId() !== tr2.getId() && adj?.getType() === tr1.getType(),
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
        if (!isDuplicated(hexagon, adjs2)) {
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
            if (!isDuplicated(hexagon, adjs3)) {
              hexagon.push(adjs3);
            }
          }
        }
      }
    });
  }

  if (hexagon.length === 6) {
    return hexagon;
  }
  return undefined;
};
