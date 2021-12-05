import { Vector3 } from '@babylonjs/core';
import { TriangleEdge } from 'models/Triangle';
import IIcosahedronDeserializer, {
  Icosahedron,
  Triangle,
  Triangles,
  ISubdivisionStrategy,
} from './IIcosahedronDeserializer';

interface AdjacentJSON {
  triangleId: number;
}
interface VertexJSON {
  _x: number;
  _y: number;
  _z: number;
}

interface TriangleJson {
  triangleId: bigint;
  vertices: Array<VertexJSON>;
  type: number;
  adjacents: Array<AdjacentJSON>;
}

class JsonIcosahedronDeserializer implements IIcosahedronDeserializer {
  private version = '1.0.0';

  public deserialize(
    descriptor: string,
    subdivisionStrategy: ISubdivisionStrategy,
  ): Icosahedron {
    const parsed = JSON.parse(descriptor, (key, value) => {
      if (key === 'jsonSerializerVersion') {
        // eslint-disable-next-line no-console
        console.assert(
          this.version === value,
          'Mismatching serializer/deserializer versions',
        );
      }
      return value;
    });
    const jsonTriangleMap = parsed.triangles.reduce(
      (prev: any, curr: { triangleId: any }) => {
        const id = `${curr.triangleId}`;
        return { ...prev, [id]: curr };
      },
      {},
    );
    const triangles = parsed.triangles.map((triangle: TriangleJson) => {
      const { triangleId, vertices, type } = triangle;
      // eslint-disable-next-line no-underscore-dangle
      const p1 = new Vector3(vertices[0]._x, vertices[0]._y, vertices[0]._z);
      // eslint-disable-next-line no-underscore-dangle
      const p2 = new Vector3(vertices[1]._x, vertices[1]._y, vertices[1]._z);
      // eslint-disable-next-line no-underscore-dangle
      const p3 = new Vector3(vertices[2]._x, vertices[2]._y, vertices[2]._z);

      return new Triangle(triangleId, p1, p2, p3, type);
    });
    const triangleMap = triangles.reduce(
      (prev: any, curr: { getId: () => bigint }) => {
        const id = `${curr.getId()}`;
        return { ...prev, [id]: curr };
      },
      {},
    );
    triangles.forEach((tr: Triangle) => {
      const id = `${tr.getId()}`;
      jsonTriangleMap[id].adjacents.forEach(
        (adj: { triangleId: number }, idx: TriangleEdge) => {
          tr.setAdjacent(triangleMap[`${adj.triangleId}`], idx);
        },
      );
      return tr;
    });
    return new Icosahedron({
      triangles,
      subdivisionStrategy,
    });
  }
}
export default JsonIcosahedronDeserializer;
