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
    super(options, settableValues);
    this.fill = options.fill || 'rgba(0,0,0,0)';
    this.radius = options.radius || 0;
    this.strokeColor = options.strokeColor || 'rgba(0,0,0,0)';
    this.strokeWidth = options.strokeWidth || 0;
    this.shadowColor = options.shadowColor;
    this.shadowBlur = options.shadowBlur || 0;
    this.shadowOffsetX = options.shadowOffsetX || 0;
    this.shadowOffsetY = options.shadowOffsetY || 0;
  }

  private setShadow(ctx: CanvasRenderingContext2D) {
    if (!this.shadowColor) return;
    ctx.shadowColor = this.shadowColor;
    ctx.shadowBlur = this.shadowBlur;
    ctx.shadowOffsetX = this.shadowOffsetX;
    ctx.shadowOffsetY = this.shadowOffsetY;
  }

  private setStroke(path: Path2D, ctx: CanvasRenderingContext2D) {
    if (!this.strokeWidth) return;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.stroke(path);  
  }

  render(canvas: Canvas, parentMatrix: DOMMatrix) {
    super.render(canvas, parentMatrix, (ctx, x, y) => {
      ctx.beginPath();
      this.setShadow(ctx);
      ctx.fillStyle = this.fill;
      const rectPath = new Path2D();
      rectPath.roundRect(x, y, this.width.activePixelValue, this.height.activePixelValue, this.radius);
      this.activePath = rectPath;
      this.setStroke(rectPath, ctx);
      ctx.fill(rectPath);
    });
  }
}