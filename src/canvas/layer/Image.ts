import Layer, { LayerOptions } from './Layer';
import type Canvas from '../Canvas';
import { ComputedNumberDependency, ComputedNumberDerivative, ComputedNumberUnit } from '../util/unit/ComputedNumber';

export type ImageOptions = LayerOptions & {
  src?: string;
};

const settableValues = [
  'src',
];

export default class ImageLayer extends Layer {
  image: HTMLImageElement = new Image();
  imageLoaded: boolean = false;
  imageLoadError: boolean = false;
  imageTrueWidth: number = 0;
  imageTrueHeight: number = 0;
  src: string;

  constructor(options: ImageOptions) {
    super(options, settableValues);
    this.src = options.src || '';
    this.loadImage();
  }

  loadImage() {
    if (!this.src) return;
    this.image = new Image();
    this.image.onload = () => {
      this.imageTrueWidth = this.image.width;
      this.imageTrueHeight = this.image.height;
      this.imageLoaded = true;
      this.flagRedraw();
    };
    this.image.onerror = () => {
      this.imageLoadError = true;
    };
    this.image.src = this.src;
  }

  seedComputedUnits(ctx: CanvasRenderingContext2D) {
    const computedUnits = super.seedComputedUnits(ctx);
    const heightScale = this.imageTrueHeight / this.imageTrueWidth;
    const height = this.width.activePixelValue * heightScale;

    for (const unit of computedUnits) {
      if (unit.dependency === ComputedNumberDependency.auto) {
        if (!height) continue; // excessive, ts
        unit.seed(height + this.padding[0].activePixelValue + this.padding[2].activePixelValue || 0);
        continue;
      }
    }

    return computedUnits;
  }

  render(canvas: Canvas, parentMatrix: DOMMatrix) {
    super.render(canvas, parentMatrix, (ctx, x, y) => {
      if (!this.src || this.imageLoadError || !this.imageLoaded) {
        return;
      }

      // Draw the image given the this.width and this.height
      ctx.drawImage(this.image, x, y, this.width.activePixelValue, this.height.activePixelValue);
    });
  }
}