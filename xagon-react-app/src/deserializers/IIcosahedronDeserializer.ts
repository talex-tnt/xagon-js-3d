import Icosahedron from 'models/Icosahedron';
import Triangle from 'models/Triangle';
import ISubdivisionStrategy from 'models/Icosahedron/SubdivisionStrategy/ISubdivisionStrategy';
export type Triangles = Array<Triangle>;

export { Icosahedron, Triangle, ISubdivisionStrategy };

abstract class IIcosahedronDeserializer {
  abstract deserialize(
    descriptor: string,
    subdivisionStrategy: ISubdivisionStrategy,
  ): Icosahedron;
}
export default IIcosahedronDeserializer;
