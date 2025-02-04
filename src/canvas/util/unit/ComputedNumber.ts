export enum ComputedNumberDependency {
  parent = 'parent',
  viewport = 'viewport',
  none = 'none',
  auto = 'auto',
}

export enum ComputedNumberUnit {
  px = 'px',
  vh = 'vh',
  vw = 'vw',
  percent = 'percent',
  auto = 'auto',
}

export enum ComputedNumberDerivative {
  width = 'width',
  height = 'height',
  // TODO the next two aren't used yet, but they can be
  // fontSize = 'fontSize',
  // size = 'size',
}

export default class ComputedNumber {
  providedValue: string | number;
  value: number = 0;
  activePixelValue: number = 0;
  unit: ComputedNumberUnit = ComputedNumberUnit.px;
  dependency: ComputedNumberDependency = ComputedNumberDependency.none;
  derivative: ComputedNumberDerivative;

  constructor(value: string | number, derivative: ComputedNumberDerivative) {
    this.parseValue(value);
    this.providedValue = value;
    this.derivative = derivative;
  }

  // Provide the derivative and set the activePixelValue depending on the unit
  seed(value: number) {
    if ([ComputedNumberUnit.px, ComputedNumberUnit.auto].includes(this.unit)) {
      this.activePixelValue = value;
      return;
    }
    if ([ComputedNumberUnit.percent, ComputedNumberUnit.vh, ComputedNumberUnit.vw].includes(this.unit)) {
      this.activePixelValue = value * (this.value / 100);
   }
  }

  // Todo this method is imperfect, will allow strange values like 100pxvh... but maybe that's fine
  parseValue(value: string | number) {
    if (typeof value === 'number') {
      this.dependency = ComputedNumberDependency.none;
      this.unit = ComputedNumberUnit.px;
      this.activePixelValue = value;
      this.value = value;
      return;
    }

    const extractedValue = parseFloat(value as string);
    if (value === 'auto') {
      this.dependency = ComputedNumberDependency.auto;
      this.unit = ComputedNumberUnit.auto;
      this.activePixelValue = extractedValue;
      this.value = 0; // Could use a null or 'auto' value here
      return;
    }
    if (value.endsWith('px')) {
      this.dependency = ComputedNumberDependency.none;
      this.unit = ComputedNumberUnit.px;
      this.activePixelValue = extractedValue;
      this.value = extractedValue;
      return;
    }
    if (value.endsWith('%')) {
      this.dependency = ComputedNumberDependency.parent;
      this.unit = ComputedNumberUnit.percent;
      this.value = extractedValue;
      return;
    }
    if (value.endsWith('vh') || value.endsWith('vw')) {
      this.dependency = ComputedNumberDependency.viewport;
      this.unit = value.endsWith('vh') ? ComputedNumberUnit.vh : ComputedNumberUnit.vw;
      this.value = extractedValue;
      return;
    }
    
    if (Number.isNaN(extractedValue)) {
      throw new Error(`Invalid value ${value}`);
    } else {
      this.dependency = ComputedNumberDependency.none;
      this.unit = ComputedNumberUnit.px;
      this.value = extractedValue;
    }
  }
}