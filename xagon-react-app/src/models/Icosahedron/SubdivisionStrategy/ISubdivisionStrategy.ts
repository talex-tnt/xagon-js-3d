import Icosahedron from '..';
import Triangle from '../../Triangle';
export { Triangle, Icosahedron };
export type Triangles = Array<Triangle>;

abstract class ISubdivisionStrategy {
  abstract subdivide(icosahedron: Icosahedron): Triangles;
}
export default ISubdivisionStrategy;
