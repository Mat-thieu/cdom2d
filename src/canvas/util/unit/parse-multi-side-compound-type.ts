import ComputedNumber, { ComputedNumberDerivative, ComputedNumberDependency, ComputedNumberUnit } from './ComputedNumber';

// Used for stuff like margin, padding and border-radius where there's multiple ways to decide each side
type stringOrNumber = string | number;
export type MultiSideCompoundType = number | string | [stringOrNumber, stringOrNumber] | [stringOrNumber, stringOrNumber, stringOrNumber, stringOrNumber];
export type FourPartUnit = [ComputedNumber, ComputedNumber, ComputedNumber, ComputedNumber]; 

const sideDefinition = [
  ComputedNumberDerivative.height, // top
  ComputedNumberDerivative.width, // right
  ComputedNumberDerivative.height, // bottom
  ComputedNumberDerivative.width, // left
]

export default function parseMultiSideCompoundType(unit: MultiSideCompoundType, dependency: ComputedNumberDependency = ComputedNumberDependency.parent): FourPartUnit {
  let unitArray: any[] = [];
  if (typeof unit === 'string') {
    unitArray = unit.split(' ');
  }
  if (typeof unit === 'number') {
    unitArray = [unit, unit, unit, unit];
  }
  if (Array.isArray(unit)) {
    unitArray = unit;
  }

  if (unitArray.length === 1) {
    unitArray = [unitArray[0], unitArray[0], unitArray[0], unitArray[0]];
  }
  if (unitArray.length === 2) {
    unitArray = [unitArray[0], unitArray[1], unitArray[0], unitArray[1]];
  }
  if (unitArray.length === 3) {
    unitArray = [unitArray[0], unitArray[1], unitArray[2], unitArray[1]];
  }
  return unitArray.map((unit, index) => new ComputedNumber(unit, sideDefinition[index], dependency)) as FourPartUnit;
}