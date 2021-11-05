import { Nullable } from '@babylonjs/core';
import TriangleMesh from '..';

abstract class IMeshState {
  abstract update(): Nullable<IMeshState>;

  abstract onFlip(triangleMesh: TriangleMesh): void;
}
export default IMeshState;
