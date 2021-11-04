import React from 'react';
import {
  Vector3,
  Scene,
  SceneLoader,
  TransformNode,
  // MeshBuilder,
} from '@babylonjs/core';
import {
  k_triangleAssetName,
  k_triangleAssetFileName,
  k_triangleAssetDebugFileName,
} from 'constants/identifiers';

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.
import SceneComponent from 'components/SceneComponent';
import Icosahedron from 'models/Icosahedron';
import { math /* , addAxisToScene  */ } from 'utils';
import TriangleMesh from 'rendering/TriangleMesh';
import setupCamera from './setupCamera';
import setupLight from './setupLight';
import InputManager from './InputManager';

const onSceneReady = (sceneArg: Scene) => {
  const scene: Scene = sceneArg;
  const target = new Vector3(0, 0, 0);
  const camera = setupCamera(scene, target);
  camera.inputs.attached.pointers.buttons = [1];

  const icosahedron = new Icosahedron();
  icosahedron.subdivide();
  // icosahedron.subdivide();
  // icosahedron.subdivide();

  const triangles = icosahedron.getTriangles();

  scene.metadata = { icosahedron };

  const inputManager = new InputManager(scene, camera, triangles);
  setupLight(scene, target);

  SceneLoader.ImportMeshAsync(
    k_triangleAssetName,
    './assets/models/',
    k_triangleAssetDebugFileName,
  ).then(({ meshes, skeletons }) => {
    if (meshes && meshes.length > 0) {
      const assetMesh = meshes[0];
      const TRIANGLE_RADIUS = 1;
      const TRIANGLE_SIDE = TRIANGLE_RADIUS * (3 / Math.sqrt(3));
      const TRIANGLE_SCALE = 0.85;

      const equilateralTriangle = icosahedron.findEquilateralTriangle();

      const triangleEdgeLength = equilateralTriangle
        .p1()
        .subtract(equilateralTriangle.p2())
        .length();

      const scalingRatio =
        (1 / TRIANGLE_SIDE) * triangleEdgeLength * TRIANGLE_SCALE;

      const radiusEquilaterTriangle = equilateralTriangle
        .p1()
        .subtract(equilateralTriangle?.getCenterPoint())
        .length();

      triangles.forEach((tr) => {
        const triangleMesh = new TriangleMesh({
          scene,
          triangle: tr,
          radiusEquilaterTriangle,
          triangleMeshScalingRatio: scalingRatio,
        });
      });
      assetMesh.visibility = 0;

      inputManager.onMeshLoaded(assetMesh, scalingRatio);
    }
  });
};

const onRender = (scene: Scene) => {
  const root = scene.getTransformNodeByName('root');
  if (root) {
    // const deltaTimeInMillis = scene.getEngine().getDeltaTime();
    // const rpm = 5;
    // root.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
};

const GameComponent: React.FC = () => (
  <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} />
);

export default GameComponent;
