import React from 'react';
import {
  Vector3,
  Scene,
  SceneLoader,
  TransformNode,
  StandardMaterial,
  // MeshBuilder,
} from '@babylonjs/core';
import {
  k_triangleAssetFileName,
  k_triangleAssetName,
} from 'constants/identifiers';

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.
import SceneComponent from 'components/SceneComponent';
import Icosahedron from 'models/Icosahedron';
import { math /* , addAxisToScene  */ } from 'utils';
import setupCamera from './setupCamera';
import setupLight from './setupLight';
import InputManager from './inputManager/InputManager';

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
    k_triangleAssetFileName,
  ).then(({ meshes, skeletons }) => {
    if (meshes && meshes.length > 0) {
      const triangleMesh = meshes[0];
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

      const rootNode = new TransformNode('root');

      triangles.slice(0, 16).forEach((tr, i) => {
        const meshClone = triangleMesh?.clone(tr.getName(), triangleMesh);
        if (meshClone) {
          const positionNode = new TransformNode(`positionNode${i}`);
          positionNode.parent = rootNode;
          const rotationNode = new TransformNode(`rotationNode${i}`);
          rotationNode.parent = positionNode;
          const flipNode = new TransformNode(`scalingNode${i}`);
          flipNode.parent = rotationNode;
          const scalingNode = new TransformNode(`scalingNode${i}`);
          scalingNode.parent = flipNode;

          meshClone.metadata = { triangle: tr };

          const triangleCenter = tr.getCenterPoint();
          const direction = triangleCenter; // Center - origin
          meshClone.parent = scalingNode;

          const yawCorrection = 0;
          const pitchCorrection = math.angle90;
          const rollCorrection = 0;
          positionNode.setDirection(
            direction,
            yawCorrection,
            pitchCorrection,
            rollCorrection,
          );
          rotationNode.position = new Vector3(0, direction.length(), 0);
          scalingNode.scaling = new Vector3(
            scalingRatio,
            scalingRatio,
            scalingRatio,
          );

          const material = new StandardMaterial('cloneMaterial', scene);
          material.diffuseColor = tr.getColor();
          material.backFaceCulling = false;
          material.alpha = 1;
          meshClone.material = material;

          // addAxisToScene({ scene, size: 1, parent: meshClone });
          // addAxisToScene({ scene, size: 1, parent: positionNode });

          const p1CenterVector = tr.p1().subtract(triangleCenter);
          const p2CenterVector = tr.p2().subtract(triangleCenter);
          const p3CenterVector = tr.p3().subtract(triangleCenter);

          const angle = Vector3.GetAngleBetweenVectors(
            positionNode.forward,
            p1CenterVector,
            positionNode.up,
          );

          rotationNode.rotate(meshClone.up, angle);

          if (skeletons && triangleMesh.skeleton) {
            meshClone.skeleton = triangleMesh.skeleton.clone(`skeleton${i}`);
            const skeletonMesh = meshClone.skeleton;

            const rotationBone1 = skeletonMesh.bones[0].rotation;
            const rotationBone2 = skeletonMesh.bones[1].rotation;

            const angleP1ToP3 = Vector3.GetAngleBetweenVectors(
              p1CenterVector,
              p3CenterVector,
              positionNode.up,
            );
            const angleP1ToP2 = Vector3.GetAngleBetweenVectors(
              p1CenterVector,
              p2CenterVector,
              positionNode.up,
            );

            rotationBone1.y += angleP1ToP3 - math.angle120;
            rotationBone2.y += angleP1ToP2 + math.angle120;
            skeletonMesh.bones[0].setRotation(rotationBone1);
            skeletonMesh.bones[1].setRotation(rotationBone2);

            if (radiusEquilaterTriangle) {
              const scaleBones = [
                p3CenterVector.length() / radiusEquilaterTriangle,
                p2CenterVector.length() / radiusEquilaterTriangle,
                p1CenterVector.length() / radiusEquilaterTriangle,
              ];

              skeletonMesh.bones.map((bone, index) =>
                bone.scale(1, scaleBones[index], 1),
              );
            }
          }
        }
      });
      triangleMesh.visibility = 0;

      inputManager.onMeshLoaded(triangleMesh, scalingRatio);
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
