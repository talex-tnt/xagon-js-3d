import { Nullable, Vector3 } from '@babylonjs/core';

export type TriangleVertices = Array<Vector3>;
export type TriangleId = bigint;
export type AdjacentTriangles = Array<AdjacentTriangle>;
export type AdjacentTriangle = Nullable<Triangle>;

export enum TriangleEdge {
  First = 0,
  Second,
  Third,
}

class Triangle {
  //
  private vertices: TriangleVertices;

  private triangleId: TriangleId;

  private adjacents: AdjacentTriangles = [];

  public constructor(id: TriangleId, p1: Vector3, p2: Vector3, p3: Vector3) {
    this.triangleId = id;
    this.vertices = [p1, p2, p3];
  }

  public getId(): TriangleId {
    return this.triangleId;
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

  public getAdjacents(): AdjacentTriangles {
    return this.adjacents;
  }

  public setAdjacent(triangle: AdjacentTriangle, index: TriangleEdge): void {
    this.adjacents[index] = triangle;
  }

  public pushAdjacent(triangle: Triangle): void {
    // eslint-disable-next-line no-console
    console.assert(this.adjacents.length <= 3, 'FATAL ERROR!!!');
    if (!this.adjacents.find((tr) => tr?.getId() === triangle.getId())) {
      this.adjacents.push(triangle);
    }
  }

  public log(): void {
    // eslint-disable-next-line no-console
    console.log(this.vertices);
  }
}

export default Triangle;
