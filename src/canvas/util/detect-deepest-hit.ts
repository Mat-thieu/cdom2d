import Canvas from "../Canvas";
import Layer from "../layer/Layer";
import pointInPoly from "./point-in-poly";

export default function detectDeepestHit(x: number, y: number, canvas: Canvas, layers: Set<Layer>): Layer | null {
  const detectHits = (x: number, y: number, layers: Set<Layer>): Layer | null => {
    let foundLayer = null;
    for (const layer of layers) {
      if (layer.canvas !== canvas) continue;

      // ! Consider if this can be used instead to save a dependency
      // const { ctx } = canvas;
      // const m = layer.matrix;
      // ctx.save();
      // ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      // const centerWidth = layer.width.activePixelValue / 2;
      // const centerHeight = layer.height.activePixelValue / 2;
      // ctx.translate(-centerWidth, -centerHeight);
      // const hit = ctx.isPointInPath(layer.activePath as Path2D, x, y);
      // ctx.restore();

      const hit = pointInPoly(x, y, layer.points);
      if (hit) {
        foundLayer = layer;
      }
      const deeperLayer = detectHits(x, y, layer.layers);
      if (deeperLayer) {
        foundLayer = deeperLayer;
      }
    }
    return foundLayer;
  }
  return detectHits(x, y, layers);
}
