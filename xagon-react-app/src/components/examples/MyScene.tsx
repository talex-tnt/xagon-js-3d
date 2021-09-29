/* eslint-disable react/no-children-prop */
import React from 'react';
import { Scene, Engine, SceneEventArgs } from 'react-babylonjs';
// import { Vector3, ArcRotateCamera} from '@babylonjs/core';
import {
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  HemisphericLight,
} from '@babylonjs/core';

const onSceneMount = (e: SceneEventArgs) => {
  const { canvas, scene } = e;
  {
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
    camera.attachControl(canvas, true);
  }
  {
    const direction = new Vector3(0, 1, 0);
    // eslint-disable-next-line no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const light = new HemisphericLight('light', direction, scene);
  }
  {
    const options = {};
    /* const box = */ MeshBuilder.CreateBox('box', options);
  }
  scene.getEngine().runRenderLoop(() => {
    if (scene) {
      scene.render();
    }
  });
};

const MyScene: React.FC = () => (
  <Engine
    canvasId="sample-canvas"
    antialias
    width={window.innerWidth}
    height={window.innerHeight} /* adaptToDeviceRatio */
  >
    <Scene onSceneMount={onSceneMount} children={undefined}></Scene>
  </Engine>
);
export default MyScene;
