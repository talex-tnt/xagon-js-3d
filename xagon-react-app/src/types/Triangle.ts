import { Vector3 } from '@babylonjs/core';

type TriangleVertices = Array<Vector3>;

//
class Triangle {
  private vertices: TriangleVertices;

  public constructor(p1: Vector3, p2: Vector3, p3: Vector3) {
    this.vertices = [p1, p2, p3];
  }

  public p1(): Vector3 {
    return this.vertices[0];
  }

  public p2(): Vector3 {
    return this.vertices[1];
  }

  public p3(): Vector3 {
    return this.vertices[2];
  }

  public getVertices(): TriangleVertices {
    return this.vertices;
  }

  public log(): void {
    // eslint-disable-next-line no-console
    console.log(this.vertices);
  }
}

export default Triangle;
