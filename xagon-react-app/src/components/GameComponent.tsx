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
  const angle90 = Math.PI / 2;
  const angle120 = Math.PI / (6 / 4);
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
  // icosahedron.subdivide();
  // icosahedron.subdivide();
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
      const TRIANGLE_RADIUS = 1;
      const TRIANGLE_SIDE = TRIANGLE_RADIUS * (3 / Math.sqrt(3));
      const TRIANGLE_SCALE = 0.9;
      const triangleEdgeLength = icosahedron.findShortestEdgeLength();
      const scalingRatio =
        (1 / TRIANGLE_SIDE) * triangleEdgeLength * TRIANGLE_SCALE;

      // console.log('loaded', triangleMesh);
      // console.log('meshes', meshes);

      // if (skeletons && skeletons.length > 0) {
      //   const skeleton = skeletons[0];
      //   console.log('bones', skeleton.bones);
      //   skeleton.bones[0].scale(1, 1, 1);
      //   skeleton.bones[1].scale(1, 1, 1);
      //   skeleton.bones[2].scale(1, 1, 1);
      // } else {
      //   console.warn('No skeletons found');
      // }

      triangles.forEach((tr, i) => {
        triangleMesh.scaling = new Vector3(
          scalingRatio,
          scalingRatio,
          scalingRatio,
        );
        const meshClone = triangleMesh?.clone(`Triangle${i}`, triangleMesh);
        if (meshClone) {
          const meshNode = new TransformNode(`tranformNode${i}`);
          meshClone.metadata = { triangle: tr };
          const triangleCenter = tr.getCenterPoint();
          const direction = triangleCenter; // Center - origin
          meshClone.parent = meshNode;
          meshNode.setDirection(direction, 0, angle90, 0);
          meshClone.position = new Vector3(0, direction.length(), 0);

          // addAxisToScene({ scene, size: 1, parent: meshClone });
          // addAxisToScene({ scene, size: 1, parent: meshNode });
          const p1CenterVector = tr.p1().subtract(triangleCenter);
          const p2CenterVector = tr.p2().subtract(triangleCenter);
          const p3CenterVector = tr.p3().subtract(triangleCenter);

          const angle = Vector3.GetAngleBetweenVectors(
            meshNode.forward,
            p1CenterVector,
            meshNode.up,
          );
          //
          meshClone.rotate(meshClone.up, angle);
          if (meshClone && skeletons && triangleMesh.skeleton) {
            meshClone.skeleton = triangleMesh.skeleton.clone(`skeleton${i}`);
            const skeletonMesh = meshClone.skeleton;

            // const angle2 = Vector3.GetAngleBetweenVectors(
            //   p3CenterVector,
            //   p1CenterVector,
            //   meshNode.up,
            // );
            // const R2 = skeletonMesh.bones[2].rotation;
            // R2.y -= angle2 + Math.PI / (6 / 4);

            const RotationBone1 = skeletonMesh.bones[0].rotation;
            const RotationBone2 = skeletonMesh.bones[1].rotation;

            const angleP1ToP3 = Vector3.GetAngleBetweenVectors(
              p1CenterVector,
              p3CenterVector,
              meshNode.up,
            );
            const angleP1ToP2 = Vector3.GetAngleBetweenVectors(
              p1CenterVector,
              p2CenterVector,
              meshNode.up,
            );

            RotationBone1.y += angleP1ToP3 - angle120;
            RotationBone2.y += angleP1ToP2 + angle120;

            skeletonMesh.bones[0].setRotation(RotationBone1);
            skeletonMesh.bones[1].setRotation(RotationBone2);
            // skeletonMesh.bones[2].setRotation(R2);
          }
        }
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
