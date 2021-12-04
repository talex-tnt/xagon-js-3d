import { Vector3 } from '@babylonjs/core';
import { k_epsilon } from 'constants/index';
import EquilateralTriangleProvider from 'rendering/TriangleMesh/EquilateralTriangleProvider';
import Triangle from './Triangle';

class Icosahedron extends EquilateralTriangleProvider {
  //
  private triangles: Array<Triangle>;

  private triangleCount = 0n;

  private genTriangleId(): bigint {
    this.triangleCount += 1n;
    return this.triangleCount;
  }

  public constructor() {
    super();
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
    ].map(Vector3.Normalize);

    const makeTriangle = (indices: Array<number>) =>
      new Triangle(
        this.genTriangleId(),
        points[indices[0]],
        points[indices[1]],
        points[indices[2]],
      );

    this.triangles = [
      [0, 1, 2],
      [3, 2, 1],
      [3, 4, 5],
      [3, 8, 4],
      [0, 6, 7],
      [0, 9, 6],
      [4, 10, 11],
      [6, 11, 10],
      [2, 5, 9],
      [11, 9, 5],
      [10, 7, 8],
      [1, 8, 7],
      [3, 5, 2],
      [3, 1, 8],
      [0, 2, 9],
      [0, 7, 1],
      [6, 9, 11],
      [6, 10, 7],
      [4, 11, 5],
      [4, 8, 10],
    ].map(makeTriangle);

    computeAdjacentTriangles(this.triangles);
  }

  public getTriangles(): Array<Triangle> {
    return this.triangles;
  }

  private subdivideTriangle(triangle: Triangle): Array<Triangle> {
    const center1 = Vector3.Center(triangle.p2(), triangle.p1());
    const center2 = Vector3.Center(triangle.p3(), triangle.p2());
    const center3 = Vector3.Center(triangle.p1(), triangle.p3());

    const p1 = center1.scale(1 / center1.length());
    const p2 = center2.scale(1 / center2.length());
    const p3 = center3.scale(1 / center3.length());

    const subTriangles = [
      new Triangle(this.genTriangleId(), triangle.p1(), p1, p3),
      new Triangle(this.genTriangleId(), p1, triangle.p2(), p2),
      new Triangle(this.genTriangleId(), p1, p2, p3),
      new Triangle(this.genTriangleId(), p3, p2, triangle.p3()),
    ];

    subTriangles.forEach((tr) => tr.setType(Triangle.getRandomType()));

    return subTriangles;
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
    const fractionDigits = 8;
    const equilateralTriangle = this.triangles.find((tr) => {
      const edgeLength1 = tr
        .p1()
        .subtract(tr.p2())
        .length()
        .toFixed(fractionDigits);
      const edgeLength2 = tr
        .p2()
        .subtract(tr.p3())
        .length()
        .toFixed(fractionDigits);
      const edgeLength3 = tr
        .p3()
        .subtract(tr.p1())
        .length()
        .toFixed(fractionDigits);

      return edgeLength1 === edgeLength2 && edgeLength2 === edgeLength3;
    });
    if (!equilateralTriangle) {
      // eslint-disable-next-line no-console
      console.warn('Equilateral Triangle not found');
      // eslint-disable-next-line no-debugger
      debugger;
    }
    return equilateralTriangle || this.triangles[0]; // this.triangles[0] shouldn't ever been returned
  }
}

function computeAdjacentTriangles(triangles: Triangle[]) {
  const hasPoint = (triangle: Triangle, point: Vector3): boolean => {
    const found = triangle.getVertices().find((trPoint: Vector3) => {
      if (Math.abs(point.subtract(trPoint).length()) < k_epsilon) {
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
