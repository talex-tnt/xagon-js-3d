import Triangle from 'models/Triangle';
import IIcosahedronSerializer, { Icosahedron } from './IIcosahedronSerializer';

class JsonIcosahedronSerializer implements IIcosahedronSerializer {
  private version = '1.0.0';

  private spacingLevel = 2;

  public serialize(icosahedron: Icosahedron): string {
    const triangles = icosahedron.getTriangles();
    const json = {
      jsonSerializerVersion: this.version,
      triangles,
    };

    return JSON.stringify(
      json,
      (key, value) => {
        if (key === 'adjacents') {
          // to prevent circular dependencies
          return value.map((tr: Triangle) => ({
            triangleId: tr.getId(),
          }));
        }
        if (key === '_isDirty') {
          return undefined;
        }
        // apparently javascript's JSON doesn't know much of bigints
        return typeof value === 'bigint' ? value.toString() : value;
      },
      this.spacingLevel,
    );
  }
}
export default JsonIcosahedronSerializer;
