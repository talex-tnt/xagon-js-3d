import Triangle from 'models/Triangle';
import Icosahedron from 'models/Icosahedron';
export { Triangle, Icosahedron };
export type Triangles = Array<Triangle>;

abstract class ISubdivisionStrategy {
  abstract subdivide(icosahedron: Icosahedron): Triangles;
}
export default ISubdivisionStrategy;
