import { Vector3 } from '@babylonjs/core';

export type EdgeId = bigint;

class Edge {
  //
  private edge: Vector3;

  private edgePoints: Array<Vector3>;

  private edgeId: EdgeId;

  public constructor(id: EdgeId, a: Vector3, b: Vector3) {
    this.edgeId = id;
    this.edgePoints = [a, b];
    this.edge = a.subtract(b);
  }

  public getEdge(): Vector3 {
    return this.edge;
  }

  public getId(): EdgeId {
    return this.edgeId;
  }

  public length(): number {
    return this.edge.length();
  }

  public getCenterPoint(scaleFactor = 1): Vector3 {
    return this.edgePoints[1].add(this.edge.scale(scaleFactor));
  }
}

export default Edge;
