import { Vector3 } from '@babylonjs/core';
import Triangle from './Triangle';
import Edge from './Edge';

class Icosahedron {
  private triangles: Array<Triangle>;

  private triangleCount = 0n;

  private edgeCount = 0n;

  private generateTriangleId(): bigint {
    this.triangleCount += 1n;
    return this.triangleCount;
  }

  private generateEdgeId(): bigint {
    this.edgeCount += 1n;
    return this.edgeCount;
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
      new Triangle(this.generateTriangleId(), points[0], points[1], points[2]),
      new Triangle(this.generateTriangleId(), points[3], points[2], points[1]),
      new Triangle(this.generateTriangleId(), points[3], points[4], points[5]),
      new Triangle(this.generateTriangleId(), points[3], points[8], points[4]),
      new Triangle(this.generateTriangleId(), points[0], points[6], points[7]),
      new Triangle(this.generateTriangleId(), points[0], points[9], points[6]),
      new Triangle(
        this.generateTriangleId(),
        points[4],
        points[10],
        points[11],
      ),
      new Triangle(
        this.generateTriangleId(),
        points[6],
        points[11],
        points[10],
      ),
      new Triangle(this.generateTriangleId(), points[2], points[5], points[9]),
      new Triangle(this.generateTriangleId(), points[11], points[9], points[5]),
      new Triangle(this.generateTriangleId(), points[1], points[7], points[8]),
      new Triangle(this.generateTriangleId(), points[10], points[8], points[7]),
      new Triangle(this.generateTriangleId(), points[3], points[5], points[2]),
      new Triangle(this.generateTriangleId(), points[3], points[1], points[8]),
      new Triangle(this.generateTriangleId(), points[0], points[2], points[9]),
      new Triangle(this.generateTriangleId(), points[0], points[7], points[1]),
      new Triangle(this.generateTriangleId(), points[6], points[9], points[11]),
      new Triangle(this.generateTriangleId(), points[6], points[10], points[7]),
      new Triangle(this.generateTriangleId(), points[4], points[11], points[5]),
      new Triangle(this.generateTriangleId(), points[4], points[8], points[10]),
    ];

    computeAdjacentTriangles(this.triangles);
  }

  public getTriangles(): Array<Triangle> {
    return this.triangles;
  }

  private subdivideTriangle(triangle: Triangle): Array<Triangle> {
    const edge1 = new Edge(this.generateEdgeId(), triangle.p2(), triangle.p1());
    const center1 = edge1.getMiddlePoint();

    const edge2 = new Edge(this.generateEdgeId(), triangle.p3(), triangle.p2());
    const center2 = edge2.getMiddlePoint();

    const edge3 = new Edge(this.generateEdgeId(), triangle.p1(), triangle.p3());
    const center3 = edge3.getMiddlePoint();

    const p1 = center1.scale(1 / center1.length());
    const p2 = center2.scale(1 / center2.length());
    const p3 = center3.scale(1 / center3.length());

    const tr1 = new Triangle(this.generateTriangleId(), triangle.p1(), p1, p3);
    const tr2 = new Triangle(this.generateTriangleId(), p1, triangle.p2(), p2);
    const tr3 = new Triangle(this.generateTriangleId(), p1, p2, p3);
    const tr4 = new Triangle(this.generateTriangleId(), p3, p2, triangle.p3());
    const randomType = () =>
      Math.floor(Math.random() * Triangle.getTypesCount());

    tr1.setType(randomType());
    tr2.setType(randomType());
    tr3.setType(randomType());
    tr4.setType(randomType());

    return [tr1, tr2, tr3, tr4];
  }

  public subdivide(): void {
    this.triangles = this.triangles.reduce(
      (prev: Array<Triangle>, curr: Triangle) => [
        ...prev,
        ...this.subdivideTriangle(curr),
      ],
      [],
    );

    computeAdjacentTriangles(this.triangles);
  }

  public findEquilateralTriangle(): Triangle {
    const equilateralTriangle = this.triangles.find((tr) => {
      const edge1 = tr.p1().subtract(tr.p2()).length();
      const edge2 = tr.p2().subtract(tr.p3()).length();
      const edge3 = tr.p3().subtract(tr.p1()).length();
      return (
        edge1.toFixed(8) === edge2.toFixed(8) &&
        edge2.toFixed(8) === edge3.toFixed(8)
      );
    });
    if (!equilateralTriangle) {
      console.warn(false, 'Equilateral Triangle not found');
      debugger;
    }
    return equilateralTriangle || this.triangles[0];
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
