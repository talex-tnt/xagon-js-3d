import { Vector3 } from '@babylonjs/core';
import { k_epsilon } from 'constants/index';
import Triangle from 'models/Triangle';

export const isDuplicated = (
  triangles: Triangle[],
  triangle: Triangle,
): boolean => !!triangles.find((e) => e.getId() === triangle.getId());

export const hasPoint = (tr: Triangle, point: Vector3): boolean =>
  !!tr.getVertices().find((p) => p.subtract(point).length() < k_epsilon);

export const haveSameType = (tr1: Triangle, tr2: Triangle): boolean =>
  tr1.getType() === tr2.getType();
