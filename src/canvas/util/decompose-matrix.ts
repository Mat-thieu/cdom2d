export default function matrixDecompose(a: [a: number, b: number, c: number, d: number, e: number, f: number]) {
  const angle = Math.atan2(a[1], a[0]),
    denom = Math.pow(a[0], 2) + Math.pow(a[1], 2),
    scaleX = Math.sqrt(denom),
    scaleY = (a[0] * a[3] - a[2] * a[1]) / scaleX,
    skewX = Math.atan2(a[0] * a[2] + a[1] * a[3], denom);
  return {
    angle: angle / (Math.PI / 180),
    scaleX: scaleX,
    scaleY: scaleY,
    skewX: skewX / (Math.PI / 180),
    skewY: 0,
    translateX: a[4],
    translateY: a[5]
  };
};