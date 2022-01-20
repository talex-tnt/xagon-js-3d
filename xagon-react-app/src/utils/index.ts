import {
  DynamicTexture,
  Mesh,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  Scene,
} from '@babylonjs/core';
import Triangle from 'models/Triangle';

export { default as math } from './math';

export const addAxisToScene = ({
  scene,
  size,
  parent,
}: {
  scene: Scene;
  size: number;
  parent?: TransformNode;
}): void => {
  const makeTextPlane = (text: string, color: string, sizePlane: number) => {
    const dynamicTexture = new DynamicTexture(
      'DynamicTexture',
      50,
      scene,
      true,
    );
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(
      text,
      5,
      40,
      'bold 36px Arial',
      color,
      'transparent',
      true,
    );
    const plane = Mesh.CreatePlane('TextPlane', sizePlane, scene, true);
    plane.material = new StandardMaterial('TextPlaneMaterial', scene);
    plane.material.backFaceCulling = false;
    (plane.material as StandardMaterial).specularColor = new Color3(0, 0, 0);
    (plane.material as StandardMaterial).diffuseTexture = dynamicTexture;
    if (parent) {
      plane.parent = parent;
    }
    return plane;
  };

  const axisX = Mesh.CreateLines(
    'axisX',
    [Vector3.Zero(), new Vector3(size, 0, 0)],
    scene,
  );
  if (parent) {
    axisX.parent = parent;
  }
  axisX.color = new Color3(1, 0, 0);
  const xChar = makeTextPlane('X', 'red', size / 10);
  xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);
  const axisY = Mesh.CreateLines(
    'axisY',
    [Vector3.Zero(), new Vector3(0, size, 0)],
    scene,
  );
  if (parent) {
    axisY.parent = parent;
  }
  axisY.color = new Color3(0, 1, 0);
  const yChar = makeTextPlane('Y', 'green', size / 10);
  yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);
  const axisZ = Mesh.CreateLines(
    'axisZ',
    [Vector3.Zero(), new Vector3(0, 0, size)],
    scene,
  );
  if (parent) {
    axisZ.parent = parent;
  }
  axisZ.color = new Color3(0, 0, 1);
  const zChar = makeTextPlane('Z', 'blue', size / 10);
  zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
};

export const adjsTrianglesDebug = (
  triangles: Triangle[],
  id: number,
): Triangle[] => {
  const testTriangle = triangles.filter((t) => t.getId() === BigInt(id));
  const testAdjacents = testTriangle[0].getAdjacents() as Triangle[];
  return triangles.filter((t) => {
    if (testTriangle && testAdjacents) {
      return (
        t.getId() === testTriangle[0].getId() ||
        t.getId() === testAdjacents[0].getId() ||
        t.getId() === testAdjacents[1].getId() ||
        t.getId() === testAdjacents[2].getId()
      );
    }
    return t;
  });
};
