import { Vector3 } from '@babylonjs/core';
import Triangle from './Triangle';

class Icosahedron {
  private triangles: Array<Triangle>;

  private triangleCount = 0n;

  private generateId(): bigint {
    this.triangleCount += 1n;
    return this.triangleCount;
  }

  public constructor() {
    const phi = (1.0 + Math.sqrt(5.0)) * 0.5; // golden ratio
    const a = 1.0;
    const b = 1.0 / phi;

    const points = [
      new Vector3(0, b, -a),
      new Vector3(b, a, 0),
      new Vector3(-b, a, 0),
      new Vector3(0, b, a),
      new Vector3(0, -b, a),
      new Vector3(-a, 0, b),
      new Vector3(0, -b, -a),
      new Vector3(a, 0, -b),
      new Vector3(a, 0, b),
      new Vector3(-a, 0, -b),
      new Vector3(b, -a, 0),
      new Vector3(-b, -a, 0),
    ];

    points.forEach((p: Vector3) => p.normalize());

    this.triangles = [
      new Triangle(this.generateId(), points[0], points[1], points[2]),
      new Triangle(this.generateId(), points[3], points[2], points[1]),
      new Triangle(this.generateId(), points[3], points[4], points[5]),
      new Triangle(this.generateId(), points[3], points[8], points[4]),
      new Triangle(this.generateId(), points[0], points[6], points[7]),
      new Triangle(this.generateId(), points[0], points[9], points[6]),
      new Triangle(this.generateId(), points[4], points[10], points[11]),
      new Triangle(this.generateId(), points[6], points[11], points[10]),
      new Triangle(this.generateId(), points[2], points[5], points[9]),
      new Triangle(this.generateId(), points[11], points[9], points[5]),
      new Triangle(this.generateId(), points[1], points[7], points[8]),
      new Triangle(this.generateId(), points[10], points[8], points[7]),
      new Triangle(this.generateId(), points[3], points[5], points[2]),
      new Triangle(this.generateId(), points[3], points[1], points[8]),
      new Triangle(this.generateId(), points[0], points[2], points[9]),
      new Triangle(this.generateId(), points[0], points[7], points[1]),
      new Triangle(this.generateId(), points[6], points[9], points[11]),
      new Triangle(this.generateId(), points[6], points[10], points[7]),
      new Triangle(this.generateId(), points[4], points[11], points[5]),
      new Triangle(this.generateId(), points[4], points[8], points[10]),
    ];

    computeAdjacentTriangles(this.triangles);
  }

  public getTriangles(): Array<Triangle> {
    return this.triangles;
  }
}

function computeAdjacentTriangles(triangles: Triangle[]) {
  const hasPoint = (triangle: Triangle, point: Vector3): boolean => {
    const epsilon = 0.00000001;
    const found = triangle.getVertices().find((trPoint: Vector3) => {
      if (Math.abs(point.subtract(trPoint).length()) < epsilon) {
        return true;
      }
      return false;
    });
    return !!found;
  };
  triangles.forEach((tr1) => {
    triangles.forEach((tr2) => {
      if (tr1.getId() !== tr2.getId()) {
        const tr1HasPoint1 = hasPoint(tr1, tr2.p1());
        const tr1HasPoint2 = hasPoint(tr1, tr2.p2());
        const tr1HasPoint3 = hasPoint(tr1, tr2.p3());
        if (tr1HasPoint1 && tr1HasPoint2) {
          tr1.pushAdjacent(tr2);
          tr2.pushAdjacent(tr1);
        }
        if (tr1HasPoint2 && tr1HasPoint3) {
          tr1.pushAdjacent(tr2);
          tr2.pushAdjacent(tr1);
        }
        if (tr1HasPoint3 && tr1HasPoint1) {
          tr1.pushAdjacent(tr2);
          tr2.pushAdjacent(tr1);
        }
      }
    });
  });
}

export default Icosahedron;

/*
edgeTrianglesMap[p1][p2] = [triangle0];

*/
