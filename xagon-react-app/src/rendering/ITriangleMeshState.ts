import { Nullable } from '@babylonjs/core';

abstract class ITriangleMeshState {
  abstract update(): Nullable<ITriangleMeshState>;
}
export default ITriangleMeshState;
