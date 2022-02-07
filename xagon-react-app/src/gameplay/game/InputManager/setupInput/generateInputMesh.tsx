import {
  TransformNode,
  Vector3,
  Scene,
  Mesh,
  StandardMaterial,
  VertexData,
  Color3,
  MeshBuilder,
  PointerEventTypes,
} from '@babylonjs/core';
import {
  DEBUG_RENDERING_ADJACENTS,
  DEBUG_RENDERING_ALL_TRIANGLES_CENTER,
} from 'game-constants/debug';

import Triangle, { TriangleId } from 'models/Triangle';

const getMeshName = (triangleId: TriangleId): string => {
  const meshName = `Input${triangleId}`;
  return meshName;
};

const generateInputMesh = (
  name: string,
  scene: Scene,
  triangles: Array<Triangle>,
  renderNormals = false,
): void => {
  //
  const rootNode = new TransformNode(name, scene);

  triangles.forEach((triangle) => {
    if (DEBUG_RENDERING_ALL_TRIANGLES_CENTER) {
      const line = MeshBuilder.CreateLines(`tr${triangle.getName()}`, {
        points: [
          triangle.getCenterPoint().scale(1.05),
          triangle.getCenterPoint(),
        ],
      });
      line.color = new Color3(0, 0, 0);
    }

    const vertexData = createVertexData(triangle, renderNormals);
    const meshName = getMeshName(triangle.getId());
    const mesh = createMesh(meshName, scene, vertexData);
    mesh.parent = rootNode;
    mesh.metadata = { triangle };
  });

  if (DEBUG_RENDERING_ADJACENTS) {
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

              adjacentIds.forEach((adjId) => {
                const adjMesh = scene.getMeshByName(getMeshName(adjId));

                if (adjMesh && adjMesh.material) {
                  adjMesh.material.alpha = 0.5;
                  const mat: StandardMaterial =
                    adjMesh.material as StandardMaterial;
                  mat.diffuseColor = new Color3(0, 0, 0);
                }
              });
            }
          }

          break;
        default:
          break;
      }
    });
  }
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
  customMesh.isPickable = true;
  const material = new StandardMaterial('myMaterial', scene);
  const hue = Math.random() * 255;
  const saturation = 1;
  const value = 1;
  Color3.HSVtoRGBToRef(hue, saturation, value, material.diffuseColor);
  material.backFaceCulling = false;
  material.alpha = 0;
  customMesh.material = material;
  vertexData.applyToMesh(customMesh, true);
  return customMesh;
};

export default generateInputMesh;
