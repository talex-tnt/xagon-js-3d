import {
  Vector3,
  Scene,
  Mesh,
  StandardMaterial,
  VertexData,
  Color3,
  MeshBuilder,
  PointerEventTypes,
} from '@babylonjs/core';

import Triangle, { TriangleId } from 'models/Triangle';

const getMeshName = (triangleId: TriangleId): string => {
  const meshName = `${triangleId}`;
  return meshName;
};

const meshGenerator = (
  scene: Scene,
  triangles: Array<Triangle>,
  renderNormals = false,
): void => {
  triangles.forEach((triangle) => {
    const vertexData = createVertexData(triangle, renderNormals);
    const meshName = getMeshName(triangle.getId());
    const mesh = createMesh(meshName, scene, vertexData);
    mesh.metadata = { triangle };
  });

  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERDOWN:
        {
          const mesh =
            pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
          const metadata = mesh && mesh.metadata;
          if (metadata) {
            const { triangle } = metadata;

            const adjacentIds: Array<TriangleId> = triangle
              .getAdjacents()
              .map((tr: Triangle) => tr?.getId() || -1);
            // eslint-disable-next-line no-console
            // console.log('picked triangle', triangle, adjacentIds);
            adjacentIds.forEach((adjId) => {
              const adjMesh = scene.getMeshByName(getMeshName(adjId));
              // console.log('adj mesh', adjMesh);

              if (adjMesh && adjMesh.material) {
                adjMesh.material.alpha = 0.5;
              }
            });
          }
        }

        break;
      default:
        break;
    }
  });
};

const createVertexData = (triangle: Triangle, renderNormals: boolean) => {
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

  if (renderNormals) {
    // Setup to debugging triangles face direction
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
  }

  return vertexData;
};

const createMesh = (
  name: string,
  scene: Scene,
  vertexData: VertexData,
): Mesh => {
  const customMesh = new Mesh(name, scene);
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

export default meshGenerator;
