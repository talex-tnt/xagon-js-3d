import { Nullable } from '@babylonjs/core';
import TriangleMesh from '..';

abstract class IMeshState {
  abstract update(
    args?: Nullable<{
      direction?: number;
      adjacentTriangleMesh?: Nullable<TriangleMesh>;
    }>,
  ): Nullable<IMeshState>;
}
export default IMeshState;
