import { Nullable } from '@babylonjs/core';
import ITriangleMeshState from './ITriangleMeshState';

class MeshStateIdle extends ITriangleMeshState {
  public update(): Nullable<ITriangleMeshState> {
    return null;
  }
}
export default MeshStateIdle;
