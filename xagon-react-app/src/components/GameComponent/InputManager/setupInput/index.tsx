import { ArcRotateCamera, Scene } from '@babylonjs/core';
import Triangle from 'models/Triangle';
import generateInputMesh from './generateInputMesh';

const setupInput = (
  scene: Scene,
  camera: ArcRotateCamera,
  triangles: Triangle[],
): void => {
  const canvas = scene.getEngine().getRenderingCanvas();
  camera.attachControl(canvas, true);
  generateInputMesh('icosahedron', scene, triangles);
};

export default setupInput;
