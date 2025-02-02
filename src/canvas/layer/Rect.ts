import Layer, { LayerOptions } from './Layer';
import type Canvas from '../Canvas';

export type RectOptions = LayerOptions & {
  fill?: string;
  radius?: number | [number, number, number, number];
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
};

const settableValues = [
  'fill',
  'radius',
  'strokeColor',
  'strokeWidth',
  'shadowColor',
  'shadowBlur',
  'shadowOffsetX',
  'shadowOffsetY',
];

export default class Rect extends Layer {
  fill: string;
  radius: number | [number, number, number, number];
  strokeColor: string;
  strokeWidth: number;
  shadowColor?: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;

  constructor(options: RectOptions) {
    super(options);
    this.fill = options.fill || 'rgba(0,0,0,0)';
    this.radius = options.radius || 0;
    this.strokeColor = options.strokeColor || 'rgba(0,0,0,0)';
    this.strokeWidth = options.strokeWidth || 0;
    this.shadowColor = options.shadowColor;
    this.shadowBlur = options.shadowBlur || 0;
    this.shadowOffsetX = options.shadowOffsetX || 0;
    this.shadowOffsetY = options.shadowOffsetY || 0;
  }

  set(key: keyof RectOptions, value: any) { // ! TODO Keyof rectoptions volatile, value any
    let visibleChange = false;
    if (settableValues.includes(key)) {
      if (this[key as keyof this] !== value) {
        visibleChange = true;
      }
      this[key as keyof this] = value;
    }
    super.set(key as keyof LayerOptions, value, visibleChange);
  }

  setShadow(ctx: CanvasRenderingContext2D) {
    if (this.shadowColor) {
      ctx.shadowColor = this.shadowColor;
      ctx.shadowBlur = this.shadowBlur;
      ctx.shadowOffsetX = this.shadowOffsetX;
      ctx.shadowOffsetY = this.shadowOffsetY;
    }
  }

  setStroke(path: Path2D, ctx: CanvasRenderingContext2D) {
    if (this.strokeWidth) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke(path);  
    }
  }

  render(canvas: Canvas, parentMatrix: DOMMatrix) {
    super.render(canvas, parentMatrix, (ctx, x, y) => {
      ctx.beginPath();
      this.setShadow(ctx);
      ctx.fillStyle = this.fill;
      const rectPath = new Path2D();
      rectPath.roundRect(x, y, this.width.activePixelValue, this.height.activePixelValue, this.radius);
      this.activePath = rectPath;
      ctx.fill(rectPath);
      this.setStroke(rectPath, ctx);
    });
  }
}