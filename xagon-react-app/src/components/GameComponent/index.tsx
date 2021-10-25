import React from 'react';
import {
  Vector3,
  Scene,
  SceneLoader,
  TransformNode,
  StandardMaterial,
  Color3,
  AbstractMesh,
  PointerEventTypes,
  PointerDragBehavior,
  Nullable,
  MeshBuilder,
} from '@babylonjs/core';

import SceneComponent from 'components/SceneComponent';
import Icosahedron from 'models/Icosahedron';
import { math, addAxisToScene } from 'utils';
import Triangle from 'models/Triangle';
import { Material } from 'react-babylonjs';
import setupCamera from './setupCamera';
import setupInput from './setupInput';
import setupLight from './setupLight';

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.

const onSceneReady = (sceneArg: Scene) => {
  const scene: Scene = sceneArg;
  const target = new Vector3(0, 0, 0);
  const camera = setupCamera(scene, target);

  const icosahedron = new Icosahedron();
  icosahedron.subdivide();
  // icosahedron.subdivide();
  // icosahedron.subdivide();

  const triangles = icosahedron.getTriangles();

  scene.metadata = { icosahedron };

  setupInput(scene, camera, triangles);
  setupLight(scene, target);

  SceneLoader.ImportMeshAsync(
    'TriangleMesh',
    './assets/models/',
    'triangle.babylon',
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
          const scalingNode = new TransformNode(`scalingNode${i}`);
          scalingNode.parent = rotationNode;

          meshClone.metadata = { triangle: tr };

          const triangleCenter = tr.getCenterPoint();
          const direction = triangleCenter; // Center - origin
          meshClone.parent = scalingNode;
          positionNode.setDirection(direction, 0, math.angle90, 0);
          rotationNode.position = new Vector3(0, direction.length(), 0);
          scalingNode.scaling = new Vector3(
            scalingRatio,
            scalingRatio,
            scalingRatio,
          );
          // Clone Color
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
          //
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
              const scaleBone0 =
                p3CenterVector.length() / radiusEquilaterTriangle;
              const scaleBone1 =
                p2CenterVector.length() / radiusEquilaterTriangle;
              const scaleBone2 =
                p1CenterVector.length() / radiusEquilaterTriangle;
              skeletonMesh.bones[0].scale(1, scaleBone0, 1);
              skeletonMesh.bones[1].scale(1, scaleBone1, 1);
              skeletonMesh.bones[2].scale(1, scaleBone2, 1);
            }
          }
        }
      });
      triangleMesh.visibility = 0;

      scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
          case PointerEventTypes.POINTERDOWN:
            {
              const mesh =
                pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
              if (mesh) {
                const assetMesh = getAssetMesh(mesh);
                const { triangle } = mesh.metadata;
                if (assetMesh && assetMesh.skeleton) {
                  const flipNode = new TransformNode(
                    `flipNode${triangle.getId()}`,
                  );
                  flipNode.parent = assetMesh.parent;
                  assetMesh.parent = flipNode;

                  const objSpaceP1 = assetMesh.skeleton.bones[0]
                    .getDirection(triangleMesh.up)
                    .scale(scalingRatio);
                  const objSpaceP2 = assetMesh.skeleton.bones[1]
                    .getDirection(triangleMesh.up)
                    .scale(scalingRatio);
                  const objSpaceP3 = assetMesh.skeleton.bones[2]
                    .getDirection(triangleMesh.up)
                    .scale(scalingRatio);

                  const edges = [
                    objSpaceP1.subtract(objSpaceP3),
                    objSpaceP1.subtract(objSpaceP2),
                    objSpaceP3.subtract(objSpaceP2),
                  ];

                  flipNode.position = Vector3.Center(
                    objSpaceP2,
                    objSpaceP3,
                  ).scale(1 / (scalingRatio * TRIANGLE_SCALE));
                  assetMesh.position = Vector3.Center(
                    objSpaceP2,
                    objSpaceP3,
                  ).scale(-1 / (scalingRatio * TRIANGLE_SCALE));

                  // debug rotation edge
                  // MeshBuilder.CreateLines('line', {
                  //   points: [triangle.p1(), triangle.p2()],
                  // });

                  scene.registerBeforeRender(() => {
                    flipNode.rotate(edges[2], Math.PI * 0.01);
                  });
                }
              }
            }
            break;
          default:
            break;
        }
      });
    }

    const getAssetMesh = (
      mesh: false | Nullable<AbstractMesh> | undefined,
    ): Nullable<AbstractMesh> | void => {
      if (mesh) {
        const name = mesh.metadata.triangle.getName();
        const assetMesh = scene.getMeshByName(name);
        if (assetMesh) {
          return assetMesh;
        }
        return mesh;
      }
      return undefined;
    };
  });
};

const onRender = (scene: Scene) => {
  // const root = scene.getTransformNodeByName('root');
  // if (root) {
  //   const deltaTimeInMillis = scene.getEngine().getDeltaTime();
  //   const rpm = 5;
  //   root.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  // }
};

const GameComponent: React.FC = () => (
  <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} />
);

export default GameComponent;
