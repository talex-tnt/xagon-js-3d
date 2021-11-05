import { Nullable } from '@babylonjs/core';
import TriangleMesh from '..';
import IMeshState from './IMeshState';

class MeshStateRotating extends IMeshState {
  public update(): Nullable<IMeshState> {
    return null;
  }

  public onFlip(triangleMesh: TriangleMesh): void {
    // eslint-disable-next-line no-console
    console.log(triangleMesh);
  }
}
export default MeshStateRotating;
