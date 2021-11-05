import { Nullable } from '@babylonjs/core';
import TriangleMesh from '..';
import IMeshState from './IMeshState';
import MeshStateRotating from './MeshStateRotating';

class MeshStateIdle extends IMeshState {
  private triangleMesh: TriangleMesh;

  private nextState: Nullable<IMeshState> = null;

  public constructor(triangleMesh: TriangleMesh) {
    super();
    this.triangleMesh = triangleMesh;
  }

  public update(
    adjacentTriangleMesh?: Nullable<TriangleMesh>,
  ): Nullable<IMeshState> {
    if (adjacentTriangleMesh) {
      this.nextState = new MeshStateRotating({
        thisTriangleMesh: this.triangleMesh,
        adjacentTriangleMesh,
      });
    }
    return this.nextState;
  }
}
export default MeshStateIdle;
