import './style.css'
import { Canvas, Rect, Text, Component } from "./canvas/index";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="canvas1" style="border: 1px solid cyan;"></canvas>
  <canvas id="canvas2" style="border: 1px solid cyan;">
    <rect x="10" y="10" width="100" height="100" fill="red">
      <text x="50" y="50" fill="white">
        Text Contents
      </text>
    </rect> 
  </canvas>
`;

const canvas = new Canvas(document.querySelector<HTMLCanvasElement>('#canvas1') as HTMLCanvasElement, {
  width: '80%',
  height: '45vh',
  renderBackground: (ctx, width, height) => {
    ctx.fillStyle = 'rgba(199, 43, 210, 0.37)';
    ctx.fillRect(0, 0, width, height);
  },
});

const canvas2 = new Canvas(document.querySelector<HTMLCanvasElement>('#canvas2') as HTMLCanvasElement, {
  width: '80%',
  height: '45vh',
  renderBackground: (ctx, width, height) => {
    ctx.fillStyle = 'rgba(100, 43, 210, 0.37)';
    ctx.fillRect(0, 0, width, height);
  },
});

// Todo create component abstract
new Component((node) =>
  node(Rect, { className: 'one' }, [
    node(Rect, { className: 'two' }, [
      node(Rect, { className: 'three' }),
    ]),
  ]),
);

// Example XML input
new Component(`
  <rect x="10" y="10" width="100" height="100" fill="red">
    <text x="50" y="50" fill="white">
      Text Contents
    </text>
  </rect> 
`);
// button.query('background').set('fill', 'red');
// button.query('text').set('text', 'Hello world');

const background = new Rect({
  className: 'background',
  x: '10%',
  y: '10%',
  width: '80vw',
  height: '80%',
  fill: 'green',
  radius: [40, 0, 0, 0],
  strokeColor: 'black',
  strokeWidth: 1,
});
canvas2.add(background);

const textBox = new Rect({
  className: 'background2',
  x: '10%',
  y: '10%',
  width: '50%',
  height: '300px',
  rotation: 20,
  scaleX: 0.8,
  fill: 'cyan',
});
canvas2.add(textBox);

const text = new Text({
  className: 'text',
  textContent: 'Hello There World More Text MORE text',
  fontWeight: 'bold',
  fontStyle: 'normal',
  fontFamily: 'Helvetica',
  lineHeight: 1.2,
  letterSpacing: 0,
  fontSize: 40,
  backgroundColor: 'purple',
  x: '10%',
  y: 30,
  width: '80%',
  height: 'auto',
  fill: 'red',
  strokeColor: 'black',
  strokeWidth: 10,
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 40,
});
textBox.addChild(text);

const backgroundC1 = new Rect({
  className: 'background',
  x: '10%',
  y: '10%',
  width: '80vw',
  height: '80%',
  fill: 'orange',
  radius: [40, 0, 0, 0],
  strokeColor: 'black',
  strokeWidth: 20,
});
canvas.add(backgroundC1);


const rect = new Rect({
  className: 'rect',
  x: 10,
  y: 10,
  width: 200,
  height: 150,
  fill: 'rgba(255, 0, 0, 0.8)',
  strokeWidth: 4,
  strokeColor: 'rgba(0, 255, 0, 0.8)',
});

const rectChild1 = new Rect({
  className: 'rectChild1',
  x: 10,
  y: 10,
  width: 100,
  height: 75,
  fill: 'rgba(0, 255, 255, 0.82)',
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
  rotation: 0,
  radius: [40, 5, 40, 5],
  strokeColor: 'rgba(100, 255, 100, 0.7)',
  strokeWidth: 8,
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 200,
});

const rectChild2 = new Rect({
  className: 'rectChild2',
  x: '50%',
  y: 50,
  width: 30,
  height: 50,
  fill: 'cyan',
  scaleX: 1,
  scaleY: 1,
  skewX: 20,
  skewY: 20,
  rotation: -20,
  strokeColor: 'rgba(0, 0, 0, 0.6)',
  radius: [20, 10, 20, 10],
  strokeWidth: 2,
});

rect.addChild(rectChild1);
rect.addChild(rectChild2);
canvas.add(rect);


Object.assign(window, {
  textBox,
  canvas2,
  backgroundC1,
  rect,
  rectChild1,
  rectChild2,
  canvas,
  background,
});