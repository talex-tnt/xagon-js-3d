import {
  DynamicTexture,
  Mesh,
  StandardMaterial,
  Color3,
  Vector3,
  Scene,
} from '@babylonjs/core';

export const addAxisToScene = (
  scene: Scene,
  size: number,
  x?: Vector3,
  y?: Vector3,
  z?: Vector3,
): void => {
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
    return plane;
  };

  const axisX = Mesh.CreateLines(
    'axisX',
    [
      Vector3.Zero(),
      x || new Vector3(size, 0, 0),
      //   new Vector3(size, 0, 0),
      //   new Vector3(size * 0.95, 0.05 * size, 0),
      //   new Vector3(size, 0, 0),
      //   new Vector3(size * 0.95, -0.05 * size, 0),
    ],
    scene,
  );
  axisX.color = new Color3(1, 0, 0);
  const xChar = makeTextPlane('X', 'red', size / 10);
  xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);
  const axisY = Mesh.CreateLines(
    'axisY',
    [
      Vector3.Zero(),
      // new Vector3(0, size, 0),
      y || new Vector3(0, size, 0),
      //   new Vector3(-0.05 * size, size * 0.95, 0),
      //   new Vector3(0, size, 0),
      //   new Vector3(0.05 * size, size * 0.95, 0),
    ],
    scene,
  );
  axisY.color = new Color3(0, 1, 0);
  const yChar = makeTextPlane('Y', 'green', size / 10);
  yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);
  const axisZ = Mesh.CreateLines(
    'axisZ',
    [
      Vector3.Zero(),
      z || new Vector3(0, 0, size),
      //   new Vector3(0, 0, size),
      //   new Vector3(0, -0.05 * size, size * 0.95),
      //   new Vector3(0, 0, size),
      //   new Vector3(0, 0.05 * size, size * 0.95),
    ],
    scene,
  );
  axisZ.color = new Color3(0, 0, 1);
  const zChar = makeTextPlane('Z', 'blue', size / 10);
  zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
};
