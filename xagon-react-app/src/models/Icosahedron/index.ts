import { Vector3 } from '@babylonjs/core';
import { k_epsilon } from 'game-constants';
import EquilateralTriangleProvider from 'rendering/TriangleMesh/EquilateralTriangleProvider';
import Triangle from 'models/Triangle';
import ISubdivisionStrategy from './SubdivisionStrategy/ISubdivisionStrategy';
export type Triangles = Array<Triangle>;
interface Context {
  subdivisionStrategy: ISubdivisionStrategy;
  triangles?: Triangles;
}
class Icosahedron extends EquilateralTriangleProvider {
  //
  private triangles: Triangles;

  private triangleCount = 0n;

  private subdivisionStrategy: ISubdivisionStrategy;

  private onTrianglesChanged: (triangles: Triangle[]) => void = () => undefined;

  private genTriangleId(): bigint {
    this.triangleCount += 1n;
    return this.triangleCount;
  }

  public makeTriangle(p1: Vector3, p2: Vector3, p3: Vector3): Triangle {
    return new Triangle(this.genTriangleId(), p1, p2, p3);
  }

  public constructor(context: Context) {
    super();
    this.subdivisionStrategy = context.subdivisionStrategy;
    if (context.triangles) {
      this.triangles = context.triangles;
    } else {
      this.triangles = this.computeRegularIcosahedronTriangles();
      computeAdjacentTriangles(this.triangles);
    }
  }

  private computeRegularIcosahedronTriangles() {
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

    const triangles = [
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
      [1, 7, 8],
      [10, 8, 7],
      [3, 5, 2],
      [3, 1, 8],
      [0, 2, 9],
      [0, 7, 1],
      [6, 9, 11],
      [6, 10, 7],
      [4, 11, 5],
      [4, 8, 10],
    ].map(makeTriangle);
    return triangles;
  }

  public getTriangles(): Array<Triangle> {
    return this.triangles;
  }

  public subdivide(count = 1): void {
    for (let i = 0; i < count; i += 1) {
      this.triangles = this.subdivisionStrategy.subdivide(this);
    }
    computeAdjacentTriangles(this.triangles);
  }

  public registerOnTriangleChanged(
    onTriangleChanged: (triangles: Triangle[]) => void,
  ): void {
    this.onTrianglesChanged = onTriangleChanged;
  }

  public notifyTrianglesChanged(changes: Triangle[]): void {
    this.onTrianglesChanged(changes);
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
  const findPointIndex = (triangle: Triangle, point: Vector3): number =>
    triangle

      .getVertices()

      .findIndex(
        (trPoint: Vector3) =>
          Math.abs(point.subtract(trPoint).length()) < k_epsilon,
      );
  triangles.forEach((tr1) => {
    triangles.forEach((tr2) => {
      if (tr1.getId() !== tr2.getId()) {
        const adjacentIndices = [
          findPointIndex(tr1, tr2.p1()),
          findPointIndex(tr1, tr2.p2()),
          findPointIndex(tr1, tr2.p3()),
        ].filter((i) => i !== -1);

        if (adjacentIndices.length === 2) {
          const firstIndex = adjacentIndices[0] as number;
          const secondIndex = adjacentIndices[1] as number;

          const indicesSum = firstIndex + secondIndex;
          // sum = 1 if indices [0, 1] || [1, 0]
          // sum = 2 if indices [0, 2] || [2, 0]
          // sum = 3 if indices [1, 2] || [2, 1]
          if (indicesSum === 1) {
            tr1.setAdjacent(tr2, 0);
          }
          if (indicesSum === 3) {
            tr1.setAdjacent(tr2, 1);
          }
          if (indicesSum === 2) {
            tr1.setAdjacent(tr2, 2);
          }
        }
      }
    });
  });
}

export default Icosahedron;
