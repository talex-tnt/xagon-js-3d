import { Nullable } from '@babylonjs/core';
import Triangle from 'models/Triangle';
import IMeshState from './IMeshState';

class MeshStateIdle extends IMeshState {
  public update(): Nullable<IMeshState> {
    return null;
  }

  public onFlip(triangle: Triangle): void {
    // eslint-disable-next-line no-console
    console.log(triangle);
  }
}
export default MeshStateIdle;
