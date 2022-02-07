import { Scene } from '@babylonjs/core';
import Triangle from 'models/Triangle';
import generateInputMesh from './generateInputMesh';

const setupInput = (scene: Scene, triangles: Triangle[]): void => {
  generateInputMesh('icosahedron', scene, triangles);
};

export default setupInput;
