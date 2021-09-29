import {
  Vector3,
  Scene,
  Mesh,
  StandardMaterial,
  VertexData,
  Color3,
  MeshBuilder,
} from '@babylonjs/core';

import Icosahedron from 'types/Icosahedron';
import Triangle from 'types/Triangle';

const trianglesGenerator = (scene: Scene): void => {
  const icosahedron = new Icosahedron();
  icosahedron.getTriangles().forEach((triangle) => {
    // const e1 = triangle.p2().subtract(triangle.p1());
    // const e2 = triangle.p3().subtract(triangle.p2());
    // const n = e1.cross(e2);
    // const options = {
    //   points: [triangle.p1(), triangle.p1().add(n)],
    //   updatable: true,
    // };
    // const lines = MeshBuilder.CreateLines('lines', options, scene);
    // lines.color = new Color3(1, 0, 0);
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
  {
    const options = {
      points: [
        triangle.p1(),
        triangle.p1().add(new Vector3(normals[0], normals[1], normals[2])),
      ],
      updatable: true,
    };
    const lines = MeshBuilder.CreateLines('lines', options);
    lines.color = new Color3(1, 0, 0);
  }
  {
    const options = {
      points: [
        triangle.p2(),
        triangle.p2().add(new Vector3(normals[3], normals[4], normals[5])),
      ],
      updatable: true,
    };
    const lines = MeshBuilder.CreateLines('lines', options);
    lines.color = new Color3(1, 0, 0);
  }
  {
    const options = {
      points: [
        triangle.p3(),
        triangle.p3().add(new Vector3(normals[6], normals[7], normals[8])),
      ],
      updatable: true,
    };
    const lines = MeshBuilder.CreateLines('lines', options);
    lines.color = new Color3(1, 0, 0);
  }
  return vertexData;
};

const createMesh = (scene: Scene, vertexData: VertexData): Mesh => {
  const customMesh = new Mesh('custom', scene);
  const material = new StandardMaterial('myMaterial', scene);
  const hue = Math.random() * 255;
  const saturation = 1;
  const value = 1;
  Color3.HSVtoRGBToRef(hue, saturation, value, material.diffuseColor);
  // material.specularColor = new Color3(0.5, 0.6, 0.87);
  // material.emissiveColor = new Color3(0, 1, 1);
  // material.ambientColor = new Color3(0.23, 0.98, 0.53);
  material.backFaceCulling = false;
  // material.alpha = 0.5;
  customMesh.material = material;
  vertexData.applyToMesh(customMesh, true);
  return customMesh;
};

export default trianglesGenerator;
