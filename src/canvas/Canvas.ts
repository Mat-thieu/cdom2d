import Layer from "./layer/Layer";
import type { AnyLayer } from "./types/AnyLayer";
import detectDeepestHit from "./util/detect-deepest-hit";
import { ExtendedSet } from "./util/ExtendedSet";
import ComputedNumber, { ComputedNumberDerivative, ComputedNumberDependency, ComputedNumberUnit } from "./util/unit/ComputedNumber";

export type CanvasOptions = {
  width?: number | string,
  height?: number | string,
  fps?: number,
  zoom?: number,
  panX?: number,
  panY?: number,
  renderBackground?: (ctx: CanvasRenderingContext2D, width: number, height: number, worldMatrix: DOMMatrix) => void,
}

export default class Canvas {
  layers: ExtendedSet<AnyLayer> = new ExtendedSet();
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  height: ComputedNumber;
  width: ComputedNumber;
  worldMatrix = new DOMMatrix();
  zoom: number = 1;
  panX: number = 0;
  panY: number = 0;
  fps: number = 30; // todo fps targeting

  renderBackground?: (ctx: CanvasRenderingContext2D, width: number, height: number, worldMatrix: DOMMatrix) => void;

  shouldUpdatePixelScaling: boolean = false;
  shouldUpdateWorldMatrix: boolean = false;
  layersToRedraw: Array<Layer | Canvas> = []; // very loose for now, just to flag down rerenders

  activeFps: number | null = null;
  lastFrameTime: number = 0;
  frameCount: number = 0;
  pixelRatio: number = 0;

  currentHoveringLayer: Layer | null = null;

  constructor(canvasElement: HTMLCanvasElement, options: CanvasOptions) {
    this.canvasElement = canvasElement;
    this.ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;
    this.width = new ComputedNumber(options.width || '100%', ComputedNumberDerivative.width);
    this.height = new ComputedNumber(options.height || '100%', ComputedNumberDerivative.height);
    if (options.fps) this.fps = options.fps;
    if (options.zoom) this.zoom = options.zoom;
    if (options.panX) this.panX = options.panX;
    if (options.panY) this.panY = options.panY;
    if (options.renderBackground) this.renderBackground = options.renderBackground;

    this.trackComputedUnits();
    this.trackMouseEvents();
    this.setPixelScaling();
    this.updateWorldMatrix();
    this.startRenderLoop();
  }

  moveLayerToFront(layer: AnyLayer) {
    if (!this.layers.has(layer)) return;
    this.layers.moveItem(this.layers.getIndex(layer), this.layers.size - 1);
    this.flagLayerRedraw(this);
  }

  moveLayerToBack(layer: AnyLayer) {
    if (!this.layers.has(layer)) return;
    this.layers.moveItem(this.layers.getIndex(layer), 0);
    this.flagLayerRedraw(this);
  }

  moveLayerTo(layer: AnyLayer, toIndexOrLayer: number | AnyLayer) { // todo test
    if (typeof toIndexOrLayer === 'number') {
      this.layers.moveItem(this.layers.getIndex(layer), toIndexOrLayer);
    } else {
      this.layers.moveItem(this.layers.getIndex(layer), this.layers.getIndex(toIndexOrLayer));
    }
    this.flagLayerRedraw(this);
  }

  private trackComputedUnits() {
    const computedUnits = [this.width, this.height];
    const hasViewportDependency = computedUnits.some((unit) => unit.dependency === ComputedNumberDependency.viewport);
    const hasParentDependency = computedUnits.some((unit) => unit.dependency === ComputedNumberDependency.parent);

    const flagDimensionChange = () => {
      this.shouldUpdatePixelScaling = true;
      this.shouldUpdateWorldMatrix = true;
      this.flagLayerRedraw(this);
    }

    if (hasViewportDependency) {
      const setViewportUnits = () => {
        for (const unit of computedUnits) {
          if (unit.dependency !== ComputedNumberDependency.viewport) continue;
          if (unit.unit === ComputedNumberUnit.vw) {
            unit.seed(window.innerWidth);
          }
          if (unit.unit === ComputedNumberUnit.vh) {
            unit.seed(window.innerHeight);
          }
        }
      };
      setViewportUnits();
      window.addEventListener('resize', () => {
        setViewportUnits();
        flagDimensionChange();
      });
    }

    if (hasParentDependency) {
      const setParentUnits = (width: number, height: number) => {
        for (const unit of computedUnits) {
          if (unit.dependency !== ComputedNumberDependency.parent) continue;
          if (unit.derivative === ComputedNumberDerivative.width) {
            unit.seed(width);
          }
          if (unit.derivative === ComputedNumberDerivative.height) {
            unit.seed(height);
          }
        }
      };
      // TODO lower resize trigger rate, maybe throttle on RAF
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]; // ? Can loop here but we assume always a single entry
        const contentBoxSize = entry.contentBoxSize[0];
        const width = contentBoxSize.inlineSize;
        const height = contentBoxSize.blockSize;
        setParentUnits(width, height);
        flagDimensionChange();
      });
      observer.observe(this.canvasElement.parentNode as HTMLElement);
    }
  }

  private updateWorldMatrix() {
    this.worldMatrix = new DOMMatrix();
    this.worldMatrix.translateSelf(this.panX, this.panY);
    this.worldMatrix.scaleSelf(
      this.zoom,
      this.zoom,
      0,
      this.width.activePixelValue / 2,
      this.height.activePixelValue / 2,
    );
    this.flagLayerRedraw(this);
  }

  setZoom(scale: number) {
    this.zoom = scale;
    this.updateWorldMatrix(); // todo use flag instead
  }

  setPan(x: number, y: number) {
    this.panX = x;
    this.panY = y;
    this.updateWorldMatrix();
  }

  private startRenderLoop() {
    const renderLoop: FrameRequestCallback = (timestamp: DOMHighResTimeStamp) => {
      const hasChangedPixelRatio = this.pixelRatio !== window.devicePixelRatio;
      const hasChangedLayers = this.layersToRedraw.length > 0;

      let shouldRender = false;

      if (hasChangedPixelRatio || this.shouldUpdatePixelScaling) {
        this.setPixelScaling();
        this.shouldUpdatePixelScaling = false;
        shouldRender = true;
      }
      if (this.shouldUpdateWorldMatrix) {
        this.updateWorldMatrix();
        this.shouldUpdateWorldMatrix = false;
      }
      if (hasChangedLayers) {
        shouldRender = true;
      }
      if (shouldRender) {
        this.render(); // TODO fine-grained re-renders
        this.layersToRedraw.splice(0, this.layersToRedraw.length); // Clear layers to redraw, maintain reference
      }
      this.trackFPS(timestamp);
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
  }

  private trackFPS(timestamp: number) {
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
      return;
    }
    const delta = timestamp - this.lastFrameTime;
    this.frameCount++;
    if (delta >= 1000) { // Commit every second
      const fps = (this.frameCount / delta) * 1000;
      this.activeFps = Math.round(fps);
      this.frameCount = 0;
      this.lastFrameTime = timestamp;
    }
  }

  // This deals with browser native zooming or native changes to pixel ratio, keeps the canvas sharp
  private setPixelScaling() {
    this.pixelRatio = window.devicePixelRatio;
    const canvasWidth = this.width.activePixelValue;
    const canvasHeight = this.height.activePixelValue;
    this.canvasElement.width = canvasWidth;
    this.canvasElement.height = canvasHeight;
    if (window.devicePixelRatio > 1) {
      this.canvasElement.width = canvasWidth * window.devicePixelRatio;
      this.canvasElement.height = canvasHeight * window.devicePixelRatio;
      this.canvasElement.style.width = `${canvasWidth}px`;
      this.canvasElement.style.height = `${canvasHeight}px`;
  
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  private trackMouseEvents() {
    let relativeX = 0;
    let relativeY = 0;
    const setCurrentHoverLayer = (layer: Layer | null) => {
      this.currentHoveringLayer = layer;
      if (this.currentHoveringLayer) {
        this.canvasElement.style.cursor = 'pointer';
      } else {
        this.canvasElement.style.cursor = 'default';
      }
    }
    this.canvasElement.addEventListener('mouseleave', () => {
      setCurrentHoverLayer(null);
    });
    this.canvasElement.addEventListener('mousemove', (e) => {
      if (!e.target) throw new Error('No target');
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      relativeX = e.clientX - rect.left;
      relativeY = e.clientY - rect.top;
      setCurrentHoverLayer(detectDeepestHit(relativeX, relativeY, this, this.layers));
    });

    this.canvasElement.addEventListener('click', (e) => {
      if (!e.target) throw new Error('No target');
      console.log('click', this.currentHoveringLayer);
    });
  }

  private render() {
    // console.time('render');
    const canvasWidth = this.width.activePixelValue;
    const canvasHeight = this.height.activePixelValue;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (this.renderBackground) {
      this.ctx.save();
      this.renderBackground(
        this.ctx,
        this.width.activePixelValue,
        this.height.activePixelValue,
        this.worldMatrix,
      );
      this.ctx.restore();
    }
    for (const layer of this.layers) {
      layer.render(this, this.worldMatrix);
    }
    // console.timeEnd('render');
  }

  add(layer: AnyLayer) {
    const isTopLevelLayerOnDifferentCanvas = (
      layer.canvas 
      && layer.canvas !== this
      && !layer.parentLayer
    );
    if (isTopLevelLayerOnDifferentCanvas) {
      (layer.canvas as Canvas).remove(layer);
    }
    if (layer.parentLayer) { // detach layer from parent
      layer.parentLayer.removeChild(layer);
      layer.unsetCanvas();
    }
    layer.setCanvas(this);
    this.layers.add(layer);
    this.flagLayerRedraw(layer); // Add addition info?
  }

  remove(layer: AnyLayer): boolean {
    layer.unsetCanvas();
    const didRemove = this.layers.delete(layer);
    this.flagLayerRedraw(layer); // Add removal info?

    return didRemove;
  }

  flagLayerRedraw(layer: Layer | Canvas) {
    this.layersToRedraw.push(layer);
  }
}
