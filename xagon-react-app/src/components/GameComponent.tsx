import React from 'react';
import {
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Scene,
  SceneLoader,
  TransformNode,
} from '@babylonjs/core';

import SceneComponent from 'components/SceneComponent';
import meshGenerator from 'debug/meshGenerator';
import Icosahedron from 'models/Icosahedron';

import { addAxisToScene } from 'utils';
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
  camera.minZ = 0.1;
  camera.lowerRadiusLimit = 1.5; // we dont' want to get too close

  const canvas = scene.getEngine().getRenderingCanvas();
  camera.attachControl(canvas, true);

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  light.intensity = 1.1;
  light.setDirectionToTarget(target);
  // light.parent = camera;
  const icosahedron = new Icosahedron();
  icosahedron.subdivide();
  icosahedron.subdivide();

  const triangles = icosahedron.getTriangles();

  scene.metadata = { icosahedron };
  meshGenerator('icosahedron', scene, icosahedron.getTriangles());

  SceneLoader.ImportMeshAsync(
    'TriangleMesh',
    './assets/models/',
    'triangle.babylon',
  ).then(({ meshes, skeletons }) => {
    if (meshes && meshes.length > 0) {
      const triangleMesh = meshes[0];
      // console.log('loaded', triangleMesh);
      // console.log('meshes', meshes);

      if (skeletons && skeletons.length > 0) {
        const skeleton = skeletons[0];
        console.log('bones', skeleton.bones);
        // skeleton.bones[0].scale(1, 1, 1);
        // skeleton.bones[1].scale(1, 1, 1);
        // skeleton.bones[2].scale(1, 1, 1);
      } else {
        console.warn('No skeletons found');
      }
      const triangleRadius = 1;
      const triangleSide = triangleRadius * (3 / Math.sqrt(3));
      const triangleEdgeLength = triangles[0]
        .p2()
        .subtract(triangles[0].p1())
        .length();

      const scalingRatio = (1 / triangleSide) * triangleEdgeLength;
      triangleMesh.scaling = new Vector3(
        scalingRatio,
        scalingRatio,
        scalingRatio,
      );
      triangles.slice(0, 3).map((tr, i) => {
        const meshClone = triangleMesh?.clone(`Triangle${i}`, triangleMesh);
        if (meshClone) {
          const meshNode = new TransformNode(`tranformNode${i}`);
          meshClone.metadata = { triangle: tr };
          const direction = tr.getCenterPoint();
          meshClone.parent = meshNode;
          meshNode.setDirection(direction, 0, Math.PI / 2, 0);
          meshClone.position = new Vector3(0, direction.length(), 0);
          addAxisToScene({ scene, size: 1, parent: meshClone });
        }
        // BONES
        //   if (meshClone && skeletons && triangleMesh.skeleton) {
        //     meshClone.skeleton = triangleMesh.skeleton.clone(`skeleton${i}`);

        //     const skeletonMesh = meshClone.skeleton;
        //     skeletonMesh.bones[0].scale(1, 1, 1);
        //     skeletonMesh.bones[1].scale(1, 1, 1);
        //     skeletonMesh.bones[2].scale(1, 1, 1);
        //   }
        //   console.log(meshClone.skeleton);
        // });

        return meshClone;
      });
      triangleMesh.visibility = 0;
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
