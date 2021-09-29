import {
  Vector3,
  Scene,
  Mesh,
  StandardMaterial,
  VertexData,
} from '@babylonjs/core';

import Icosahedron from 'types/Icosahedron';
import Triangle from 'types/Triangle';

const trianglesGenerator = (scene: Scene): void => {
  const icosahedron = new Icosahedron();
  icosahedron.getTriangles().forEach((triangle) => {
    const vertexData = createVertexData(triangle);
    createMesh(scene, vertexData);
  });
};

const createVertexData = (triangle: Triangle) => {
  const normals: Array<number> = [];
  const indices: Array<number> = [0, 1, 2];
  const positions = triangle
    .getVertices()
    .reduce(
      (prev: number[], curr: Vector3): number[] => [
        ...prev,
        curr.x,
        curr.y,
        curr.z,
      ],
      [],
    );
  const vertexData = new VertexData();
  VertexData.ComputeNormals(positions, indices, normals);

  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;

  return vertexData;
};

const createMesh = (scene: Scene, vertexData: VertexData): Mesh => {
  const customMesh = new Mesh('custom', scene);
  const mat = new StandardMaterial('mat', scene);
  mat.backFaceCulling = true;
  customMesh.material = mat;
  vertexData.applyToMesh(customMesh, true);
  return customMesh;
};

export default trianglesGenerator;
