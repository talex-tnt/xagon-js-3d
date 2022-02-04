import { Scene, HemisphericLight, Vector3 } from '@babylonjs/core';

const setupLight = (scene: Scene, target: Vector3): void => {
  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  light.intensity = 1.1;
  light.setDirectionToTarget(target);
  // light.parent = camera;
};

export default setupLight;
