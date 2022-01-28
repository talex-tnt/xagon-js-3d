import { PointerInfo } from '@babylonjs/core';
export type GestureId = number;

abstract class Gesture {
  public abstract onDown(pointerInfo: PointerInfo): void;

  public abstract onMove(pointerInfo: PointerInfo): void;

  public abstract onRelease(pointerInfo: PointerInfo): void;
}

export default Gesture;
