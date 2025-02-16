import Layer, { LayerOptions } from './Layer';
import type Canvas from '../Canvas';
import { ComputedNumberDependency, ComputedNumberDerivative, ComputedNumberUnit } from '../util/unit/ComputedNumber';

export type TextOptions = LayerOptions & {
  textContent?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textShadowColor?: string;
  textShadowBlur?: number;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
};

type TextLine = {
  words: string[];
  width: number;
  y: number;
  yMax: number;
};

const settableValues = [
  'textContent',
  'textStrokeColor',
  'textStrokeWidth',
  'textShadowColor',
  'textShadowBlur',
  'textShadowOffsetX',
  'textShadowOffsetY',
];

export default class TextLayer extends Layer {
  textContent: string;
  textStrokeColor: string;
  textStrokeWidth: number;
  textShadowColor?: string;
  textShadowBlur: number;
  textShadowOffsetX: number;
  textShadowOffsetY: number;

  // TODO make this a cleaner construct, 2 cache values is not enough
  // Tracks textContent and activePixelWidth
  // Should also contain font weight, family, size, letter spacing (not line height)
  textLinesCache: [string, number, TextLine[]] = ['', 0, []];

  constructor(options: TextOptions) { // todo for any constructor implement more rigid fallbacks. Some "falsey" values can be valid and shouldn't be defaulted
    super(options, settableValues);
    this.textContent = options.textContent || '';
    this.textStrokeColor = options.textStrokeColor || 'rgba(0,0,0,0)';
    this.textStrokeWidth = options.textStrokeWidth || 0;
    this.textShadowColor = options.textShadowColor;
    this.textShadowBlur = options.textShadowBlur || 0;
    this.textShadowOffsetX = options.textShadowOffsetX || 0;
    this.textShadowOffsetY = options.textShadowOffsetY || 0;
  }

  private getFontString() {
    const fontStyle = this.fontStyle;
    const fontWeight = this.fontWeight;
    const fontSize = `${this.fontSize}px`;
    const fontFamily = this.fontFamily;
    return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  }

  private setTextShadow(ctx: CanvasRenderingContext2D) {
    if (!this.textShadowColor) return;
    ctx.shadowColor = this.textShadowColor;
    ctx.shadowBlur = this.textShadowBlur;
    ctx.shadowOffsetX = this.textShadowOffsetX;
    ctx.shadowOffsetY = this.textShadowOffsetY;
  }

  private setTextStroke(text: string, ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.textStrokeWidth) return;
    ctx.strokeStyle = this.textStrokeColor;
    ctx.lineWidth = this.textStrokeWidth;
    ctx.strokeText(text, x, y);
  }

  // Todo clean up
  private calculateTextLines(ctx: CanvasRenderingContext2D): TextLine[] {
    // if ( // Check if current cache can be used
    //   this.textLinesCache[0] === this.textContent
    //   && this.textLinesCache[1] === this.width.activePixelValue
    // ) return this.textLinesCache[2];

    ctx.save();
    const fontString = this.getFontString();
    ctx.font = fontString;
    ctx.letterSpacing = `${this.letterSpacing}px`;

    const spaceMetrics = ctx.measureText(' ');
    const wordMetrics = this.textContent.split(' ').map((word) => ({
      word,
      metrics: ctx.measureText(word),
    }));
    const fontHeight = spaceMetrics.fontBoundingBoxAscent + spaceMetrics.fontBoundingBoxDescent;
    const lineHeightPx = fontHeight * this.lineHeight;
    const paddedLineHeight = ((this.lineHeight - 1) * fontHeight) / 2;

    let currentLineIndex = 0;
    const lines: TextLine[] = [];
    const createLine = (word: string, width: number) => {
      let y = 0;
      let yMax = 0;
      if (!lines.length) {
        y = paddedLineHeight;
        yMax = lineHeightPx;
      }
      else {
        const prevLine = lines[lines.length - 1];
        y = prevLine.yMax;
        yMax = prevLine.yMax + lineHeightPx - paddedLineHeight;
      }

      lines.push({ words: [word], width, y, yMax });
    }
    // Create line with first word as no checks need to happen 
    // and first line needs to exist remove first from array
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
    // this.textLinesCache[1] = this.width.activePixelValue;
    // this.textLinesCache[2] = lines;

    return lines;
  }

  // Todo leverage line caching for these so they don't have to be recalculated every render
  private drawTextLines(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const lines = this.calculateTextLines(ctx);
    const fontString = this.getFontString();
    ctx.fillStyle = this.color;
    ctx.textBaseline = 'bottom'; // Bottom to achieve correct line height
    ctx.letterSpacing = `${this.letterSpacing}px`;
    ctx.lineJoin = 'round'; // Removes text stroke sharp edges and artifacts, but may arguably be somewhat "incorrect"
    ctx.font = fontString;

    // Todo can be returned from calculateTextLines
    const spaceMetrics = ctx.measureText(' ');
    const fontHeight = spaceMetrics.fontBoundingBoxAscent + spaceMetrics.fontBoundingBoxDescent;
    // Draw each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineContent = line.words.join(' ');
      this.setTextStroke(lineContent, ctx, x, y + fontHeight + line.y);
      ctx.fillText(lineContent, x, y + fontHeight + line.y);
    }
  }

  // Todo this is awful, inefficient, but gets the result I want for now
  // ideally this is handled on the Layer level where it requests the layout sizes, but it's not straigth forward
  seedComputedUnits(ctx: CanvasRenderingContext2D) {
    const computedUnits = super.seedComputedUnits(ctx);
    const lines = this.calculateTextLines(ctx);
    const lastLine = lines.pop();
    const height = lastLine?.yMax;

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
      if (!this.textContent) return;
      this.setTextShadow(ctx);
      this.drawTextLines(ctx, x, y);
    });
  }
}
