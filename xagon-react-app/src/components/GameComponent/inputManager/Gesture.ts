import { PointerInfo } from '@babylonjs/core';
abstract class Gesture {
  public abstract onDown(pointerInfo: PointerInfo): void;

  public abstract onMove(): void;

  public abstract onRelease(pointerInfo: PointerInfo): void;
}

export default Gesture;
