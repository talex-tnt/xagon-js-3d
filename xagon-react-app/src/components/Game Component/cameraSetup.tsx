import { ArcRotateCamera, Vector3, Scene } from '@babylonjs/core';

const cameraSetup = (scene: Scene, target: Vector3): ArcRotateCamera => {
  const alpha = -Math.PI * 0.5;
  const beta = Math.PI * 0.4;
  const radius = 3;
  const camera = new ArcRotateCamera(
    'camera',
    alpha,
    beta,
    radius,
    target,
    scene,
  );
  camera.minZ = 0.1;
  camera.lowerRadiusLimit = 1.5; // we dont' want to get too close
  return camera;
};

export default cameraSetup;
