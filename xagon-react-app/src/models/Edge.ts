import { Vector3 } from '@babylonjs/core';

export type EdgeId = bigint;

class Edge {
  //

  private p1: Vector3;

  private p2: Vector3;

  private edgeId: EdgeId;

  public constructor(id: EdgeId, p1: Vector3, p2: Vector3) {
    this.edgeId = id;
    this.p1 = p1;
    this.p2 = p2;
  }

  public getVector(): Vector3 {
    return this.p2.subtract(this.p1);
  }

  public getId(): EdgeId {
    return this.edgeId;
  }

  public getMiddlePoint(): Vector3 {
    return this.p1.add(this.getVector().scale(0.5));
  }
}

export default Edge;
