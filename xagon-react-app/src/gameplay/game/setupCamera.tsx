import {
  ArcRotateCamera,
  UniversalCamera,
  Vector3,
  Scene,
  ArcRotateCameraPointersInput,
  Camera,
  KeyboardEventTypes,
} from '@babylonjs/core';

const DEBUG_CAMERA = process.env.REACT_APP_BUILD_ENV === 'development';

interface Cameras {
  [cameraId: string]: Camera;
}
const cameras: Cameras = {};

const setupArcRotateCamera = (
  cameraId: string,
  scene: Scene,
  target: Vector3 = Vector3.Zero(),
): ArcRotateCamera => {
  const alpha = -Math.PI * 0.5;
  const beta = Math.PI * 0.4;
  const radius = 3;

  const camera = new ArcRotateCamera(
    cameraId,
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

  const input = camera.inputs.attached.pointers as ArcRotateCameraPointersInput;
  input.multiTouchPanAndZoom = true;
  input.multiTouchPanning = true;
  input.buttons = [1];
  return camera;
};

const setupUniversalCamera = (
  cameraId: string,
  scene: Scene,
): UniversalCamera => {
  const camera = new UniversalCamera(cameraId, new Vector3(0, 0, -2), scene);

  camera.setTarget(Vector3.Zero());
  const canvas = scene.getEngine().getRenderingCanvas();
  camera.attachControl(canvas, true);
  camera.speed = 0.07;
  camera.minZ = 0.1;
  // eslint-disable-next-line no-console
  console.log('speed', camera.speed);
  return camera;
};
const k_arcRotateCameraId = 'ArcRotateCamera';
const k_universalCameraId = 'UniversalCamera';

const setupCameras = (scene: Scene): void => {
  cameras[k_arcRotateCameraId] = setupArcRotateCamera(
    k_arcRotateCameraId,
    scene,
  );
  if (DEBUG_CAMERA) {
    cameras[k_universalCameraId] = setupUniversalCamera(
      k_universalCameraId,
      scene,
    );
    const currentScene = scene;
    scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          // console.log('KEY DOWN: ', kbInfo.event.key);
          switch (kbInfo.event.key) {
            case 'u':
              // eslint-disable-next-line no-console
              console.log('Universal Camera ON');
              currentScene.activeCamera = cameras[k_universalCameraId];
              break;
            case 'a':
              // eslint-disable-next-line no-console
              console.log('Arc Rotate Camera ON');
              currentScene.activeCamera = cameras[k_arcRotateCameraId];
              break;
            default:
              break;
          }
          break;

        default:
          break;
      }
    });
  }
};
export default setupCameras;
