import { Nullable } from '@babylonjs/core';
import TriangleMesh from '..';

abstract class IMeshState {
  abstract update(
    adjacentTriangleMesh?: Nullable<TriangleMesh>,
  ): Nullable<IMeshState>;
}
export default IMeshState;
