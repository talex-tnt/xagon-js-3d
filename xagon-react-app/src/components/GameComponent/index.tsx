import React from 'react';
import { Vector3, Scene, SceneLoader } from '@babylonjs/core';
import {
  k_triangleAssetName,
  k_triangleAssetDebugFileName,
  k_triangleAssetPath,
} from 'constants/identifiers';

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.
import SceneComponent from 'components/SceneComponent';
import Icosahedron from 'models/Icosahedron';
import _1to4SubdivisionStrategy from 'models/Icosahedron/SubdivisionStrategy/1to4SubdivisionStrategy';
import TriangleMesh from 'rendering/TriangleMesh/index';
import JsonIcosahedronSerializer from 'serializers/JsonIcosahedronSerializer';
import JsonIcosahedronDeserializer from 'deserializers/JsonIcosahedronDeserializer';
import setupCamera from './setupCamera';
import setupLight from './setupLight';
import InputManager from './InputManager';

const onSceneReady = (sceneArg: Scene) => {
  const scene: Scene = sceneArg;
  const target = new Vector3(0, 0, 0);
  const camera = setupCamera(scene, target);
  camera.inputs.attached.pointers.buttons = [1];

  const subdivisionStrategy = new _1to4SubdivisionStrategy();
  const icosahedron = new Icosahedron({ subdivisionStrategy });
  icosahedron.subdivide(2);
  // const serializer = new JsonIcosahedronSerializer();
  // // console.log('icosahedron', serializer.serialize(icosahedron));
  // const deserializer = new JsonIcosahedronDeserializer();
  // icosahedron = deserializer.deserialize(
  //   serializer.serialize(icosahedron),
  //   subdivisionStrategy,
  // );

  const triangles = icosahedron.getTriangles();

  scene.metadata = { icosahedron };

  const inputManager = new InputManager(scene, camera, triangles);
  setupLight(scene, target);

  SceneLoader.ImportMeshAsync(
    k_triangleAssetName,
    k_triangleAssetPath,
    k_triangleAssetDebugFileName,
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
