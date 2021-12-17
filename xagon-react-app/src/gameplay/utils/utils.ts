import { Vector3 } from '@babylonjs/core';
import { k_epsilon } from 'constants/index';
import Triangle from 'models/Triangle';

export const isDuplicated = (
  triangles: Triangle[],
  triangle: Triangle,
): boolean => {
  const findTriangle = triangles.find((e) => {
    if (e) {
      return e.getId() === triangle.getId();
    }
    return undefined;
  });
  if (findTriangle) {
    return true;
  }
  return false;
};

export const hasPoint = (tr: Triangle, point: Vector3): boolean => {
  const findPoint =
    tr && tr.getVertices().find((p) => p.subtract(point).length() < k_epsilon);
  if (findPoint) {
    return true;
  }
  return false;
};

export const haveSameType = (tr1: Triangle, tr2: Triangle): boolean => {
  if (tr1.getType() === tr2.getType()) {
    return true;
  }
  return false;
};
