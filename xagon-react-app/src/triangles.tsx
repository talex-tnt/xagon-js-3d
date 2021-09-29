import * as BABYLON from '@babylonjs/core';

const trianglesGenerator = (scene: BABYLON.Scene) => {
  // Create a custom mesh
  const customMesh = new BABYLON.Mesh('custom', scene);

  // Set arrays for positions and indices
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  //   const positions = [
  //     0,
  //     1,
  //     goldenRatio,
  //     0,
  //     -1,
  //     goldenRatio,
  //     0,
  //     1,
  //     -goldenRatio,
  //     0,
  //     -1,
  //     -goldenRatio,
  //     1,
  //     goldenRatio,
  //     0,
  //     -1,
  //     goldenRatio,
  //     0,
  //     1,
  //     -goldenRatio,
  //     0,
  //     -1,
  //     -goldenRatio,
  //     0,
  //     goldenRatio,
  //     0,
  //     1,
  //     -goldenRatio,
  //     0,
  //     1,
  //     goldenRatio,
  //     0,
  //     -1,
  //     -goldenRatio,
  //     0,
  //     -1,
  //   ];
  const positions = [
    0,
    0,
    -goldenRatio,
    -goldenRatio,
    0,
    goldenRatio,
    goldenRatio,
    0,
    goldenRatio,
    goldenRatio,
    0,
    goldenRatio,
    0,
    0,
    -goldenRatio,
    0,
    2,
    0,
    0,
    2,
    0,
    0,
    0,
    -goldenRatio,
    -goldenRatio,
    0,
    goldenRatio,
  ];
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8 /* 9, 10, 11 */];

  // Empty array to contain calculated values
  const normals: Array<number> = [];

  const vertexData = new BABYLON.VertexData();
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);

  // Assign positions, indices and normals to vertexData
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;

  // Apply vertexData to custom mesh
  vertexData.applyToMesh(customMesh);

  /** ****Display custom mesh in wireframe view to show its creation*************** */
  const mat = new BABYLON.StandardMaterial('mat', scene);
  mat.backFaceCulling = false;
  customMesh.material = mat;
  /** **************************************************************************** */

  return scene;
};

export default trianglesGenerator;
