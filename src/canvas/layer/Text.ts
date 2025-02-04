import Layer, { LayerOptions } from './Layer';
import type Canvas from '../Canvas';
import { ComputedNumberDependency, ComputedNumberDerivative, ComputedNumberUnit } from '../util/unit/ComputedNumber';

export type TextOptions = LayerOptions & {
  textContent?: string;
  fontSize?: number;
  fontStyle?: string;
  fontWeight?: string;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  backgroundColor?: string;
  fill?: string;
  radius?: number | [number, number, number, number];
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
};

type TextLine = {
  words: string[];
  width: number;
};

const settableValues = [
  'textContent',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'fontFamily',
  'letterSpacing',
  'lineHeight',
  'backgroundColor',
  'fill',
  'strokeColor',
  'strokeWidth',
  'shadowColor',
  'shadowBlur',
  'shadowOffsetX',
  'shadowOffsetY',
];

export default class Text extends Layer {
  textContent: string;
  fontSize: number;
  fontStyle: string;
  fontWeight: string;
  fontFamily: string;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  fill: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor?: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;

  textLinesCache: [string, TextLine[]] = ['', []];

  constructor(options: TextOptions) { // todo for any constructor implement more rigid fallbacks. Some "falsey" values can be valid and shouldn't be defaulted
    super(options, settableValues);
    this.textContent = options.textContent || '';
    this.fontSize = options.fontSize || 30; // should probably not be default, and be a computed number
    this.fontStyle = options.fontStyle || 'normal';
    this.fontWeight = options.fontWeight || 'normal';
    this.fontFamily = options.fontFamily || 'serif';
    this.letterSpacing = options.letterSpacing || 0;
    this.lineHeight = options.lineHeight || 1.2;
    this.backgroundColor = options.backgroundColor;
    this.fill = options.fill || 'rgba(0,0,0,0)';
    this.strokeColor = options.strokeColor || 'rgba(0,0,0,0)';
    this.strokeWidth = options.strokeWidth || 0;
    this.shadowColor = options.shadowColor;
    this.shadowBlur = options.shadowBlur || 0;
    this.shadowOffsetX = options.shadowOffsetX || 0;
    this.shadowOffsetY = options.shadowOffsetY || 0;
  }

  private getFontString() {
    const fontStyle = this.fontStyle;
    const fontWeight = this.fontWeight;
    const fontSize = `${this.fontSize}px`;
    const fontFamily = this.fontFamily;
    return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  }

  private setShadow(ctx: CanvasRenderingContext2D) {
    if (!this.shadowColor) return;
    ctx.shadowColor = this.shadowColor;
    ctx.shadowBlur = this.shadowBlur;
    ctx.shadowOffsetX = this.shadowOffsetX;
    ctx.shadowOffsetY = this.shadowOffsetY;
  }

  private setStroke(text: string, ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.strokeWidth) return;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeText(text, x, y);
  }

  private setBackground(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.backgroundColor) return;
    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(x, y, this.width.activePixelValue, this.height.activePixelValue);
    ctx.restore();
  }

  private calculateTextLines(ctx: CanvasRenderingContext2D): TextLine[] {
    // if (this.textLinesCache[0] === this.textContent) return this.textLinesCache[1];
    ctx.save();
    const fontString = this.getFontString();
    ctx.font = fontString;

    const wordMetrics = this.textContent.split(' ').map((word) => ({
      word,
      metrics: ctx.measureText(word),
    }));
    const spaceMetrics = ctx.measureText(' ');

    let currentLineIndex = 0;
    const lines: TextLine[] = [];
    const createLine = (word: string, width: number) => {
      lines.push({ words: [word], width });
    }
    // Create line with first word as no checks need to happen and first line needs to exist
    // remove first from array
    createLine(wordMetrics[0].word, wordMetrics[0].metrics.width);
    wordMetrics.shift();

    // Determine each line to fit the width
    for (const wordMetric of wordMetrics) {
      const currentLine = lines[currentLineIndex];
      if (currentLine.width + spaceMetrics.width + wordMetric.metrics.width > this.width.activePixelValue) {
        createLine(wordMetric.word, wordMetric.metrics.width);
        currentLineIndex++;
        continue;
      }
      currentLine.width += spaceMetrics.width + wordMetric.metrics.width;
      currentLine.words.push(wordMetric.word);
    }
    ctx.restore();

    // this.textLinesCache[0] = this.textContent;
    // this.textLinesCache[1] = lines;

    return lines;
  }

  // Todo leverage measurement caching for these so they don't have to be recalculated every render
  private drawTextLines(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const lineHeight = this.fontSize * this.lineHeight;
    const lines = this.calculateTextLines(ctx);

    const fontString = this.getFontString();
    ctx.font = fontString;
    // Draw each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineContent = line.words.join(' ');
      const lineY = y + (i * lineHeight);
      this.setStroke(lineContent, ctx, x, lineY);
      ctx.fillText(lineContent, x, lineY);
    }
  }

  // Todo this is awful, inefficient, but gets the result I want (actually it's one tick late so no)
  // ! THIS RELIES ON this.width.activePixelValue so the Layer function needs to happen first
  // ideally this is handled on the Layer level where it requests the layout sizes, but it's not straigth forward
  seedComputedUnits(ctx: CanvasRenderingContext2D) {
    const lines = this.calculateTextLines(ctx);
    const lineHeight = this.fontSize * this.lineHeight;
    const height = lines.length * lineHeight;
    const computedUnits = super.seedComputedUnits(ctx);

    for (const unit of computedUnits) {
      if (unit.dependency === ComputedNumberDependency.auto) {
        unit.seed(height);
        continue;
      }
    }

    return computedUnits;
  }

  render(canvas: Canvas, parentMatrix: DOMMatrix) {
    super.render(canvas, parentMatrix, (ctx, x, y) => {
      this.setBackground(ctx, x, y);
      this.setShadow(ctx);
      ctx.fillStyle = this.fill;
      ctx.textBaseline = 'top';
      ctx.letterSpacing = `${this.letterSpacing}px`;
      ctx.lineJoin = 'round'; // Removes text stroke sharp edges and artifacts, but may arguably be somewhat "incorrect"
      if (this.textContent) this.drawTextLines(ctx, x, y);
    });
  }
}
