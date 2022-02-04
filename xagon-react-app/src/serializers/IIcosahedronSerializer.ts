import Icosahedron from 'models/Icosahedron';
export { Icosahedron };

abstract class IIcosahedronSerializer {
  abstract serialize(icosahedron: Icosahedron): string;
}
export default IIcosahedronSerializer;
