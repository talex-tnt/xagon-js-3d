import { ArcRotateCamera, Scene } from '@babylonjs/core';

const inputSetup = (scene: Scene, camera: ArcRotateCamera): void => {
  const canvas = scene.getEngine().getRenderingCanvas();
  camera.attachControl(canvas, true);
};

export default inputSetup;
