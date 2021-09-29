import { Vector3 } from '@babylonjs/core';
import Triangle from './Triangle';

class Icosahedron {
  private triangles: Array<Triangle>;

  public constructor() {
    const phi = (1.0 + Math.sqrt(5.0)) * 0.5; // golden ratio
    const a = 1.0;
    const b = 1.0 / phi;

    const p1 = new Vector3(0, b, -a);
    const p2 = new Vector3(b, a, 0);
    const p3 = new Vector3(-b, a, 0);
    const p4 = new Vector3(0, b, a);
    const p5 = new Vector3(0, -b, a);
    const p6 = new Vector3(-a, 0, b);
    const p7 = new Vector3(0, -b, -a);
    const p8 = new Vector3(a, 0, -b);
    const p9 = new Vector3(a, 0, b);
    const p10 = new Vector3(-a, 0, -b);
    const p11 = new Vector3(b, -a, 0);
    const p12 = new Vector3(-b, -a, 0);

    this.triangles = [
      new Triangle(p3, p2, p1),
      new Triangle(p2, p3, p4),
      new Triangle(p6, p5, p4),
      new Triangle(p5, p9, p4),
      new Triangle(p8, p7, p1),
      new Triangle(p7, p10, p1),
      new Triangle(p12, p11, p5),
      new Triangle(p11, p12, p7),
      new Triangle(p10, p6, p3),
      new Triangle(p6, p10, p12),
      new Triangle(p9, p8, p2),
      new Triangle(p8, p9, p11),
      new Triangle(p3, p6, p4),
      new Triangle(p9, p2, p4),
      new Triangle(p10, p3, p1),
      new Triangle(p2, p8, p1),
      new Triangle(p12, p10, p7),
      new Triangle(p8, p11, p7),
      new Triangle(p6, p12, p5),
      new Triangle(p11, p9, p5),
    ];
  }

  public getTriangles(): Array<Triangle> {
    return this.triangles;
  }
}

export default Icosahedron;
