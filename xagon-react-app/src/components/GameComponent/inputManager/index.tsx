import {
  Scene,
  PointerEventTypes,
  ArcRotateCamera,
  AbstractMesh,
} from '@babylonjs/core';

import Triangle from 'models/Triangle';
import Gesture, { GestureId } from './Gesture';
import FlipGesture from './FlipGesture';
import setupInput from './setupInput';

class InputManager {
  //
  private scene: Scene;

  private gesturesMap: Record<GestureId, Gesture> = {};

  public constructor(
    scene: Scene,
    camera: ArcRotateCamera,
    triangles: Triangle[],
  ) {
    this.scene = scene;
    setupInput(scene, camera, triangles);
  }

  public onMeshLoaded(triangleMesh: AbstractMesh, scalingRatio: number): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      const { pointerId } = pointerInfo.event;
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
        case PointerEventTypes.POINTERTAP:
          {
            const gestureContext = {
              scene: this.scene,
              triangleMesh,
              scalingRatio,
            };
            const mesh =
              pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
            if (mesh) {
              this.gesturesMap[pointerId] = new FlipGesture(gestureContext);
              this.gesturesMap[pointerId].onDown(pointerInfo);
            }
          }
          break;

        case PointerEventTypes.POINTERMOVE:
          {
            const gesture = this.gesturesMap[pointerId];
            if (gesture) {
              gesture.onMove();
            }
          }
          break;
        case PointerEventTypes.POINTERUP:
          {
            const gesture = this.gesturesMap[pointerId];
            if (gesture) {
              gesture.onRelease(pointerInfo);
            }
            delete this.gesturesMap[pointerId];
          }
          break;
        default:
          break;
      }
    });
  }
}

export default InputManager;