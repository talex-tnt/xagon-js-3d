import { Engine, EngineOptions, Scene, SceneOptions } from '@babylonjs/core';
// fixme: enable this import only on debug
import '@babylonjs/inspector';
import { DEBUG_RENDERING } from 'game-constants/debug';

import React, { useEffect, useRef } from 'react';
import { addAxisToScene } from 'utils';

type onRenderCallback = (a: Scene) => void;
type onSceneReadyCallback = (a: Scene) => void;

interface SceneComponentProps {
  antialias?: boolean;
  engineOptions?: EngineOptions;
  adaptToDeviceRatio?: boolean;
  sceneOptions?: SceneOptions;
  onRender: onRenderCallback;
  onSceneReady: onSceneReadyCallback;
}

const SceneComponent: React.FC<SceneComponentProps> = (props) => {
  const reactCanvas = useRef(null);
  const {
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    //
    onRender,
    onSceneReady,
    ...rest
  } = props;

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(
        reactCanvas.current,
        antialias,
        engineOptions,
        adaptToDeviceRatio,
      );
      const scene = new Scene(engine, sceneOptions);
      if (scene.isReady()) {
        onSceneReady(scene);
      } else {
        scene.onReadyObservable.addOnce((observedScene) =>
          onSceneReady(observedScene),
        );
      }

      engine.runRenderLoop(() => {
        if (typeof onRender === 'function') {
          onRender(scene);
        }
        scene.render();
      });

      const resize = () => {
        scene.getEngine().resize();
      };

      if (window) {
        window.addEventListener('resize', resize);
      }

      if (DEBUG_RENDERING) {
        scene.debugLayer.show();
        // WORLD AXIS
        addAxisToScene({ scene, size: 5 });
      }

      return () => {
        scene.getEngine().dispose();

        if (window) {
          window.removeEventListener('resize', resize);
        }
      };
    }
    return undefined;
  }, [reactCanvas]);

  return (
    <canvas
      ref={reactCanvas}
      width={window.innerWidth}
      height={window.innerHeight}
      {...rest}
    />
  );
};
export default SceneComponent;
