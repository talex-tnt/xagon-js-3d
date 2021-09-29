import {
  Vector3,
  Scene,
  Mesh,
  StandardMaterial,
  VertexData,
} from '@babylonjs/core';

import Triangle from 'types/Triangle';

const trianglesGenerator = (scene: Scene): Scene => {
  // Create a custom mesh
  const customMesh = new Mesh('custom', scene);

  // Set arrays for positions and indices
  // vertices[0] = new VertexPositionColor(new Vector3(-0.26286500f, 0.0000000f, 0.42532500f), Color.Red);
  // vertices[1] = new VertexPositionColor(new Vector3(0.26286500f, 0.0000000f, 0.42532500f), Color.Orange);
  // vertices[2] = new VertexPositionColor(new Vector3(-0.26286500f, 0.0000000f, -0.42532500f), Color.Yellow);
  // vertices[3] = new VertexPositionColor(new Vector3(0.26286500f, 0.0000000f, -0.42532500f), Color.Green);
  // vertices[4] = new VertexPositionColor(new Vector3(0.0000000f, 0.42532500f, 0.26286500f), Color.Blue);
  // vertices[5] = new VertexPositionColor(new Vector3(0.0000000f, 0.42532500f, -0.26286500f), Color.Indigo);
  // vertices[6] = new VertexPositionColor(new Vector3(0.0000000f, -0.42532500f, 0.26286500f), Color.Purple);
  // vertices[7] = new VertexPositionColor(new Vector3(0.0000000f, -0.42532500f, -0.26286500f), Color.White);
  // vertices[8] = new VertexPositionColor(new Vector3(0.42532500f, 0.26286500f, 0.0000000f), Color.Cyan);
  // vertices[9] = new VertexPositionColor(new Vector3(-0.42532500f, 0.26286500f, 0.0000000f), Color.Black);
  // vertices[10] = new VertexPositionColor(new Vector3(0.42532500f, -0.26286500f, 0.0000000f), Color.DodgerBlue);
  // vertices[11] = new VertexPositionColor(new Vector3(-0.42532500f, -0.26286500f, 0.0000000f), Color.Crimson);
  const phi = (1.0 + Math.sqrt(5.0)) * 0.5; // golden ratio
  const a = 1.0;
  const b = 1.0 / phi;
  const p1 = new Vector3(1, 2, 3);
  const p2 = new Vector3(4, 2, 6);
  const p3 = new Vector3(5, 4, 1);
  const triangleTest = new Triangle(p1, p2, p3).getVertices();
  const positions = triangleTest.reduce(
    (prev: number[], curr: Vector3): number[] => [
      ...prev,
      curr.x,
      curr.y,
      curr.z,
    ],
    [],
  );

  // eslint-disable-next-line no-console
  console.log(positions);
  const indices = [0, 1, 2];

  // Empty array to contain calculated values
  const normals: Array<number> = [];

  const vertexData = new VertexData();
  VertexData.ComputeNormals(positions, indices, normals);

  // Assign positions, indices and normals to vertexData
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;

  // Apply vertexData to custom mesh
  vertexData.applyToMesh(customMesh);

  /** ****Display custom mesh in wireframe view to show its creation*************** */
  const mat = new StandardMaterial('mat', scene);
  mat.backFaceCulling = false;
  customMesh.material = mat;
  /** **************************************************************************** */

  return scene;
};

export default trianglesGenerator;
