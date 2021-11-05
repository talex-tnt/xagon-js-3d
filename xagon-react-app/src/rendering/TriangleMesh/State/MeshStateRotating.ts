import { Nullable } from '@babylonjs/core';
import TriangleMesh from '..';
import IMeshState from './IMeshState';

class MeshStateRotating extends IMeshState {
  private triangleMesh: TriangleMesh;

  private adjacentTriangleMesh: TriangleMesh;

  public constructor({
    thisTriangleMesh,
    adjacentTriangleMesh,
  }: {
    thisTriangleMesh: TriangleMesh;
    adjacentTriangleMesh: TriangleMesh;
  }) {
    super();
    this.triangleMesh = thisTriangleMesh;
    this.adjacentTriangleMesh = adjacentTriangleMesh;
  }

  public update(): Nullable<IMeshState> {
    return null;
  }

  public onFlip(triangleMesh: TriangleMesh): void {
    // eslint-disable-next-line no-console
    console.log(triangleMesh);
  }
}
export default MeshStateRotating;
