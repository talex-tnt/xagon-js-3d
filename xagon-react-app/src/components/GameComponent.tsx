import React from 'react';
import {
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Scene,
  SceneLoader,
} from '@babylonjs/core';

import SceneComponent from 'components/SceneComponent';
import meshGenerator from 'debug/meshGenerator';
import Icosahedron from 'models/Icosahedron';
// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.

const onSceneReady = (sceneArg: Scene) => {
  const scene: Scene = sceneArg;
  const alpha = -Math.PI / 2;
  const beta = Math.PI / 2.5;
  const radius = 3;
  const target = new Vector3(0, 0, 0);
  const camera = new ArcRotateCamera(
    'camera',
    alpha,
    beta,
    radius,
    target,
    scene,
  );

  const canvas = scene.getEngine().getRenderingCanvas();

  camera.attachControl(canvas, true);

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  light.intensity = 1.1;
  light.setDirectionToTarget(target);
  // light.parent = camera;
  const icosahedron = new Icosahedron();
  icosahedron.subdivide();

  scene.metadata = { icosahedron };
  meshGenerator('icosahedron', scene, icosahedron.getTriangles());

  SceneLoader.ImportMeshAsync(
    'TriangleMesh',
    './assets/models/',
    'triangle.babylon',
  ).then(({ meshes, skeletons }) => {
    if (meshes && meshes.length > 0) {
      const triangleMesh = meshes[0];

      console.log('loaded', triangleMesh);
      console.log('meshes', meshes);

      if (skeletons && skeletons.length > 0) {
        const skeleton = skeletons[0];
        console.log('bones', skeleton.bones);
        // skeleton.bones[0].scale(0.8, 0.8, 0.8);
        // skeleton.bones[1].scale(0.8, 0.8, 0.8);
        // skeleton.bones[2].scale(0.8, 0.8, 0.8);
      } else {
        console.warn('No skeletons found');
      }
      const triangleRadius = 1;
      const triangleSide = triangleRadius * (3 / Math.sqrt(3));
      const scalingRatio = 1 / triangleSide;
      if (triangleMesh) {
        triangleMesh.scaling = new Vector3(
          scalingRatio,
          scalingRatio,
          scalingRatio,
        );
      }
    }
  });
};

const onRender = (scene: Scene) => {
  // const icosahedron = scene.getTransformNodeByName('icosahedron');
  // if (icosahedron) {
  //   const deltaTimeInMillis = scene.getEngine().getDeltaTime();
  //   const rpm = 10;
  //   icosahedron.rotation.y +=
  //     (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  // }
};

const GameComponent: React.FC = () => (
  <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} />
);

export default GameComponent;
