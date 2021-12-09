import React from 'react';
import { Vector3, Scene, SceneLoader } from '@babylonjs/core';
import {
  k_triangleAssetName,
  k_triangleAssetFileName,
  k_triangleAssetPath,
} from 'constants/identifiers';

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.
import SceneComponent from 'components/SceneComponent';
import Icosahedron from 'models/Icosahedron';
import _1to4SubdivisionStrategy from 'models/Icosahedron/SubdivisionStrategy/1to4SubdivisionStrategy';
import TriangleMesh from 'rendering/TriangleMesh/index';
import JsonIcosahedronDeserializer from 'deserializers/JsonIcosahedronDeserializer';
import JsonIcosahedronSerializer from 'serializers/JsonIcosahedronSerializer';
import setupCamera from './setupCamera';
import setupLight from './setupLight';
import InputManager from './InputManager';

const loadIcosahedron = async () => {
  const subdivisionStrategy = new _1to4SubdivisionStrategy();
  try {
    const json = await fetch('assets/data/icosahedron-0.json').then(
      (response) => response.text(),
    );
    if (json && json.length) {
      // eslint-disable-next-line no-console
      console.log('Icosahedron JSON file loaded.');
      const deserializer = new JsonIcosahedronDeserializer();
      return deserializer.deserialize(json, subdivisionStrategy);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Icosahedron JSON file was not found.');
  }
  const icosahedron = new Icosahedron({ subdivisionStrategy });
  icosahedron.subdivide(2);
  // const serializer = new JsonIcosahedronSerializer();
  // const json = serializer.serialize(icosahedron);
  // eslint-disable-next-line no-console
  // console.log('Icosahedron json', json);
  return icosahedron;
};

const onSceneReady = async (sceneArg: Scene) => {
  const scene: Scene = sceneArg;
  const target = new Vector3(0, 0, 0);
  const camera = setupCamera(scene, target);
  camera.inputs.attached.pointers.buttons = [1];
  const icosahedron = await loadIcosahedron();
  console.log('Icosahedron loaded');

  const triangles = icosahedron.getTriangles();

  scene.metadata = { icosahedron };

  const inputManager = new InputManager(scene, camera, triangles);
  setupLight(scene, target);

  SceneLoader.ImportMeshAsync(
    k_triangleAssetName,
    k_triangleAssetPath,
    k_triangleAssetFileName,
  ).then(({ meshes, skeletons }) => {
    if (meshes && meshes.length > 0 && skeletons) {
      const assetMesh = meshes[0];

      const triangleMeshes = triangles.map(
        (tr) =>
          new TriangleMesh({
            scene,
            triangle: tr,
            equilateralTriangleProvider: icosahedron,
          }),
      );
      assetMesh.visibility = 0;
      scene.registerBeforeRender(() => {
        triangleMeshes.forEach((t) => t.update());
      });

      inputManager.onMeshLoaded(assetMesh, triangleMeshes[0].getScalingRatio());
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
