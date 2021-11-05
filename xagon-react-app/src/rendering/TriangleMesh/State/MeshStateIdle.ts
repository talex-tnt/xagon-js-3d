import { Nullable } from '@babylonjs/core';
import TriangleMesh from '..';
import IMeshState from './IMeshState';

class MeshStateIdle extends IMeshState {
  private nextState: Nullable<IMeshState> = null;

  public update(): Nullable<IMeshState> {
    return this.nextState;
  }

  public onFlip(triangleMesh: TriangleMesh): void {
    // eslint-disable-next-line no-console
    console.log(triangleMesh);
  }
}
export default MeshStateIdle;
