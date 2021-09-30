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
      new Triangle(this.generateId(), p1, p2, p3),
      new Triangle(this.generateId(), p4, p3, p2),
      new Triangle(this.generateId(), p4, p5, p6),
      new Triangle(this.generateId(), p4, p9, p5),
      new Triangle(this.generateId(), p1, p7, p8),
      new Triangle(this.generateId(), p1, p10, p7),
      new Triangle(this.generateId(), p5, p11, p12),
      new Triangle(this.generateId(), p7, p12, p11),
      new Triangle(this.generateId(), p3, p6, p10),
      new Triangle(this.generateId(), p12, p10, p6),
      new Triangle(this.generateId(), p2, p8, p9),
      new Triangle(this.generateId(), p11, p9, p8),
      new Triangle(this.generateId(), p4, p6, p3),
      new Triangle(this.generateId(), p4, p2, p9),
      new Triangle(this.generateId(), p1, p3, p10),
      new Triangle(this.generateId(), p1, p8, p2),
      new Triangle(this.generateId(), p7, p10, p12),
      new Triangle(this.generateId(), p7, p11, p8),
      new Triangle(this.generateId(), p5, p12, p6),
      new Triangle(this.generateId(), p5, p9, p11),
    ];
  }

  public getTriangles(): Array<Triangle> {
    return this.triangles;
  }
}

export default Icosahedron;
