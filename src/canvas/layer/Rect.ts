// ! This class may be completely excesive as layer is a rect
import Layer, { LayerOptions } from './Layer';
import type Canvas from '../Canvas';

export type RectOptions = LayerOptions & {};

export default class Rect extends Layer {
  constructor(options: RectOptions) {
    super(options);
  }

  render(canvas: Canvas, parentMatrix: DOMMatrix) {
    super.render(canvas, parentMatrix, (ctx, x, y) => {
      // console.log('Rect');
    });
  }
}