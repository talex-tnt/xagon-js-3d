import { Vector3 } from '@babylonjs/core';
import { k_epsilon } from 'constants/index';
import Triangle from 'models/Triangle';

export const isDuplicated = (
  array: Triangle[],
  element: Triangle,
): Triangle | undefined =>
  array.find((e) => {
    if (e) {
      return e.getId() === element.getId();
    }
    return undefined;
  });

export const hasPoint = (tr: Triangle, point: Vector3): Vector3 | undefined =>
  tr && tr.getVertices().find((p) => p.subtract(point).length() < k_epsilon);

export const haveSameType = (tr1: Triangle, tr2: Triangle): boolean => {
  if (tr1.getType() === tr2.getType()) {
    return true;
  }
  return false;
};
