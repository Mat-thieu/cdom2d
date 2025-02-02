import type Canvas from '../Canvas';
import { AnyLayer } from '../types/AnyLayer';
import matrixDecompose from '../util/decompose-matrix';
import { ExtendedSet } from '../util/ExtendedSet';
import ComputedNumber, { ComputedNumberDerivative, ComputedNumberDependency, ComputedNumberUnit } from '../util/unit/ComputedNumber';

export type LayerOptions = {
  x?: number | string;
  y?: number | string;
  skewX?: number;
  skewY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
};

const settableValues = [
  'x',
  'y',
  'skewX',
  'skewY',
  'scaleX',
  'scaleY',
  'rotation',
  'width',
  'height',
];

export default abstract class Layer {
  canvas: Canvas | null = null;
  parentLayer: Layer | null = null;
  layers: ExtendedSet<AnyLayer> = new ExtendedSet();
  matrix: DOMMatrix = new DOMMatrix();
  points: DOMPoint[] = [];

  className: string = '';

  x: ComputedNumber;
  y: ComputedNumber;
  skewX: number;
  skewY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  width: ComputedNumber;
  height: ComputedNumber;

  activePath: Path2D | null = null;

  // Track per-element if a visual change occurs, then allow each connected canvas to redraw it as such
  // changed: boolean;
  
  // Draw-from-bitmap
  // cached: boolean;

  // This property will be used in determining the most efficient re-render loop.
  // A layer with any sort of opacity can't be used as a backdrop to draw over
  // Instead the underlying layers will need to be checked for this property until it's false, from there the branch can be re-rendered
  // Another condition is that the underlying layer covers the changed layer entirely
  // hasOpacity: boolean;

  constructor(options: LayerOptions) {
    this.width = new ComputedNumber(options.width || 0, ComputedNumberDerivative.width);
    this.height = new ComputedNumber(options.height || 0, ComputedNumberDerivative.height);
    this.x = new ComputedNumber(options.x || 0, ComputedNumberDerivative.width);
    this.y = new ComputedNumber(options.y || 0, ComputedNumberDerivative.height);
    this.skewX = options.skewX || 0;
    this.skewY = options.skewY || 0;
    this.scaleX = options.scaleX || 1;
    this.scaleY = options.scaleY || 1;
    this.rotation = options.rotation || 0;
    this.className = options.className || '';
  }

  // ! Todo a lot, this is very clumsy and error prone
  set(key: keyof LayerOptions, value: any, visibleChange = false) { // ! Keyof layeroptions bad
    if (settableValues.includes(key)) {
      const currentValue = this[key as keyof this];
      if (currentValue !== value) { // ! always true for ComputedNumber
        visibleChange = true;
      }
      if (currentValue instanceof ComputedNumber) {
        (this[key as keyof this] as ComputedNumber) = new ComputedNumber(value, currentValue.derivative);
      } else {
        this[key as keyof this] = value;
      }
    }
    if (visibleChange) this.flagRedraw();
  }

  flagRedraw() {
    if (this.canvas) this.canvas.flagLayerRedraw(this);
  }

  moveToFront() {
    if (this.parentLayer) {
      this.parentLayer.layers.moveItem(this.parentLayer.layers.getIndex(this), this.parentLayer.layers.size - 1);
      this.flagRedraw();
      return;
    }
    if (this.canvas) {
      this.canvas.moveLayerToFront(this);
    }
  }

  moveToBack() {
    if (this.parentLayer) {
      this.parentLayer.layers.moveItem(this.parentLayer.layers.getIndex(this), 0);
      this.flagRedraw();
      return;
    }
    if (this.canvas) {
      this.canvas.moveLayerToBack(this);
    }
  }

  moveTo(indexOrLayer: number | AnyLayer) {
    if (this.parentLayer) {
      if (typeof indexOrLayer === 'number') {
        this.parentLayer.layers.moveItem(this.parentLayer.layers.getIndex(this), indexOrLayer);
      } else {
        this.parentLayer.layers.moveItem(this.parentLayer.layers.getIndex(this), this.parentLayer.layers.getIndex(indexOrLayer));
      }
      this.flagRedraw();
      return;
    }
    if (this.canvas) {
      this.canvas.moveLayerTo(this, indexOrLayer);
    }
  }

  setCanvas(canvas: Canvas) {
    this.canvas = canvas;
    for (const layer of this.layers) layer.setCanvas(canvas);
    // Can only be empty until a render-pass happens. Maybe flag for consistency?
    // Can provide a callback for when a first rendere happened maybe, like nextTick
    this.points = [];
    this.matrix = new DOMMatrix();
  }

  unsetCanvas() {
    this.canvas = null;
    for (const layer of this.layers) layer.unsetCanvas();
  }

  addChild(childLayer: AnyLayer) {
    if (childLayer === this) throw new Error('Can\'t add self as child');
    // TODO make sure you can't create a circular. Check if layer is already a parent
    if (childLayer.canvas && !childLayer.parentLayer) {
      childLayer.canvas.remove(childLayer);
    }
    // Check if layer had parent before, if so remove it from there
    if (childLayer.parentLayer) {
      childLayer.parentLayer.removeChild(childLayer);
    }
    childLayer.parentLayer = this;
    this.layers.add(childLayer);

    if (this.canvas) {
      childLayer.setCanvas(this.canvas);
    }
    this.flagRedraw();
  }

  removeChild(childLayer: AnyLayer): boolean {
    const didRemove = this.layers.delete(childLayer);
    childLayer.parentLayer = null;
    childLayer.unsetCanvas();
    this.flagRedraw();

    return didRemove;
  }

  decomposeMatrix() {
    if (!this.canvas) throw new Error('Not drawn on canvas');

    const centerWidth = this.width.activePixelValue / 2;
    const centerHeight = this.height.activePixelValue / 2;
    const activeMatrix = this.matrix;
    const m = activeMatrix.translate(-centerWidth, -centerHeight);
    return matrixDecompose([ // TODO for decomposition we can get accurate values if we use parent matrixes and backtrace instead
      m.a,
      m.b,
      m.c,
      m.d,
      m.e,
      m.f,
    ]);
  }

  seedComputedUnits() {
    const inhertedUnits = [
      this.width,
      this.height,
      this.x,
      this.y,
    ];

    // todo this is kinda messy
    for (const unit of inhertedUnits) {
      if (unit.dependency === ComputedNumberDependency.viewport && this.canvas) {
        const targetProperty = unit.unit === ComputedNumberUnit.vw ? 'width' : 'height';
        unit.seed(this.canvas[targetProperty].activePixelValue);
        continue;
      }
      if (unit.dependency === ComputedNumberDependency.parent) {
        const targetProperty = unit.derivative === ComputedNumberDerivative.width ? 'width' : 'height';
        if (this.parentLayer) {
          unit.seed(this.parentLayer[targetProperty].activePixelValue);
        } else if (this.canvas) {
          unit.seed(this.canvas[targetProperty].activePixelValue);     
        }        
      }
    }
  }

  storePointsFromMatrix(m: DOMMatrix) {
    // ? Note the order of points is important for hit detection, always clockwise or counter-clockwise
    const centerWidth = this.width.activePixelValue / 2;
    const centerHeight = this.height.activePixelValue / 2;
    const nwMatrix = m.translate(-centerWidth, -centerHeight); // top-left
    this.points[0] = nwMatrix.transformPoint();

    const neMatrix = m.translate(centerWidth, -centerHeight); // top-right
    this.points[1] = neMatrix.transformPoint();

    const seMatrix = m.translate(centerWidth, centerHeight); // bottom-right
    this.points[2] = seMatrix.transformPoint();

    const swMatrix = m.translate(-centerWidth, centerHeight); // bottom-left
    this.points[3] = swMatrix.transformPoint();
  }

  render(
    canvas: Canvas,
    parentMatrix: DOMMatrix,
    renderLayerType?: (ctx: CanvasRenderingContext2D, x: number, y: number) => void,
  ) {
    const { ctx } = canvas;
    this.seedComputedUnits();
    ctx.save();

    const centerWidth = this.width.activePixelValue / 2;
    const centerHeight = this.height.activePixelValue / 2;
    const m = new DOMMatrix();
    m.translateSelf(this.x.activePixelValue + centerWidth, this.y.activePixelValue + centerHeight); // center-center origin
    // Todo consider sensical order of transformations, swap around scale/skew?
    m.rotateSelf(this.rotation);
    m.scaleSelf(this.scaleX, this.scaleY);
    m.skewXSelf(this.skewX);
    m.skewYSelf(this.skewY);

    m.preMultiplySelf(parentMatrix);
    this.matrix = m;

    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);

    this.storePointsFromMatrix(m);

    // Run layertype specfic render logic
    if (renderLayerType) renderLayerType(ctx, -centerWidth, -centerHeight); // Todo return bounds by which we can clip for overflow hidden

    ctx.restore();

    // Render children
    const childMatrix = m.translate(-centerWidth, -centerHeight); // offset origin-center of parent so 0,0 is top-left
    for (const layer of this.layers) {
      layer.render(canvas, childMatrix);
    }

    // ! DEBUG Draw and get points of box
    // ctx.save();

    // ctx.fillStyle = 'yellow';

    // const pointArgs = (point: DOMPoint, size = 6) => {
    //   return [
    //     point.x - (size / 2),
    //     point.y - (size / 2),
    //     size,
    //     size,
    //   ];
    // }

    // // @ts-expect-error
    // ctx.fillRect(...pointArgs(nwPoint));
    // // @ts-expect-error
    // ctx.fillRect(...pointArgs(nePoint));
    // // @ts-expect-error
    // ctx.fillRect(...pointArgs(sePoint));
    // // @ts-expect-error
    // ctx.fillRect(...pointArgs(swPoint));

    // ctx.restore();
  }
}