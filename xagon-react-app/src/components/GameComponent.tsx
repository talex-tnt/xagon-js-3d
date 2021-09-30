import React from 'react';
import {
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  Scene,
} from '@babylonjs/core';
import SceneComponent from 'components/SceneComponent';
import trianglesGenerator from 'triangles';
// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.

let box: Mesh | undefined;

const onSceneReady = (scene: Scene) => {
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

  trianglesGenerator(scene);
};

const onRender = (scene: Scene) => {
  if (box !== undefined) {
    const deltaTimeInMillis = scene.getEngine().getDeltaTime();

    const rpm = 10;
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
};

const GameComponent: React.FC = () => (
  <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} />
);

export default GameComponent;
