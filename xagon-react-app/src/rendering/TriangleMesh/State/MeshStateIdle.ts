import { Nullable, Scene } from '@babylonjs/core';
import TriangleMesh from '..';
import IMeshState from './IMeshState';
import MeshStateRotating from './MeshStateRotating';

class MeshStateIdle extends IMeshState {
  private triangleMesh: TriangleMesh;

  private nextState: Nullable<IMeshState> = null;

  private scene: Scene;

  public constructor({
    triangleMesh,
    scene,
  }: {
    triangleMesh: TriangleMesh;
    scene: Scene;
  }) {
    super();
    this.triangleMesh = triangleMesh;
    this.scene = scene;
  }

  public update(
    args: Nullable<{
      direction?: number;
      adjacentTriangleMesh?: Nullable<TriangleMesh>;
    }> = null,
  ): Nullable<IMeshState> {
    if (args && args.adjacentTriangleMesh && args.direction) {
      this.nextState = new MeshStateRotating({
        thisTriangleMesh: this.triangleMesh,
        adjacentTriangleMesh: args.adjacentTriangleMesh,
        scene: this.scene,
        direction: args.direction,
      });
    }
    return this.nextState;
  }
}
export default MeshStateIdle;
