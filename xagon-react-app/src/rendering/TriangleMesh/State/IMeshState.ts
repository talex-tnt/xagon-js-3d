import { Nullable } from '@babylonjs/core';
import Triangle from 'models/Triangle';

abstract class IMeshState {
  abstract update(): Nullable<IMeshState>;

  abstract onFlip(triangle: Triangle): void;
}
export default IMeshState;
