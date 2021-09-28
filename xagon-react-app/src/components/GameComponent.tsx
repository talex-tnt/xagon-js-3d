import React from 'react';
import {
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Mesh,
  Scene,
} from '@babylonjs/core';
import SceneComponent from 'components/SceneComponent';
// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.

let box: Mesh | undefined;

const onSceneReady = (scene: Scene) => {
  const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);

  camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  camera.attachControl(canvas, true);

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  light.intensity = 0.7;

  box = MeshBuilder.CreateBox('box', { size: 2 }, scene);

  box.position.y = 1;

  MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene);
};

const onRender = (scene: Scene) => {
  if (box !== undefined) {
    const deltaTimeInMillis = scene.getEngine().getDeltaTime();

    const rpm = 60;
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
};

const GameComponent: React.FC = () => (
  <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} />
);

export default GameComponent;
