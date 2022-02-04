import { Vector3 } from '@babylonjs/core';
import ISubdivisionStrategy, {
  Triangles,
  Triangle,
  Icosahedron,
} from './ISubdivisionStrategy';

class _1to4SubdivisionStrategy implements ISubdivisionStrategy {
  public subdivide(icosahedron: Icosahedron): Triangles {
    return icosahedron
      .getTriangles()
      .reduce(
        (prev: Array<Triangle>, curr: Triangle) => [
          ...prev,
          ...subdivideTriangle(curr, icosahedron),
        ],
        [],
      );
  }
}
export default _1to4SubdivisionStrategy;

const subdivideTriangle = (
  triangle: Triangle,
  icosahedron: Icosahedron,
): Triangles => {
  const center1 = Vector3.Center(triangle.p2(), triangle.p1());
  const center2 = Vector3.Center(triangle.p3(), triangle.p2());
  const center3 = Vector3.Center(triangle.p1(), triangle.p3());

  const p1 = center1.scale(1 / center1.length());
  const p2 = center2.scale(1 / center2.length());
  const p3 = center3.scale(1 / center3.length());

  const subTriangles = [
    icosahedron.makeTriangle(triangle.p1(), p1, p3),
    icosahedron.makeTriangle(p1, triangle.p2(), p2),
    icosahedron.makeTriangle(p1, p2, p3),
    icosahedron.makeTriangle(p3, p2, triangle.p3()),
  ];

  subTriangles.forEach((tr) => tr.setType(Triangle.getRandomType()));

  return subTriangles;
};
