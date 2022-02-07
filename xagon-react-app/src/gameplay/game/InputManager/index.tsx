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

  public constructor(scene: Scene, triangles: Triangle[]) {
    this.scene = scene;
    setupInput(scene, triangles);
  }

  public onMeshLoaded(triangleMesh: AbstractMesh): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      const { pointerId } = pointerInfo.event;
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
        case PointerEventTypes.POINTERTAP:
          {
            const mesh =
              pointerInfo?.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh;
            if (mesh) {
              const gestureContext = {
                scene: this.scene,
                triangleMesh,
                onFlipEnded: () => {
                  delete this.gesturesMap[pointerId];
                },
              };
              this.gesturesMap[pointerId] = new FlipGesture(gestureContext);
              this.gesturesMap[pointerId].onDown(pointerInfo);
            }
          }
          break;

        case PointerEventTypes.POINTERMOVE:
          {
            let gesture = this.gesturesMap[pointerId];
            if (!gesture) {
              const gestureContext = {
                scene: this.scene,
                triangleMesh,
                onFlipEnded: () => {
                  delete this.gesturesMap[pointerId];
                },
              };
              gesture = new FlipGesture(gestureContext);
              this.gesturesMap[pointerId] = gesture;
            }

            gesture.onMove(pointerInfo);
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
