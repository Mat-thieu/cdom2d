export class ExtendedSet<T> extends Set<T> {
  constructor(iterable?: Iterable<T>) {
    super(iterable);
  }

  moveItem(oldIndex: number, newIndex: number): void {
    if (oldIndex < 0 || newIndex < 0 || oldIndex >= this.size || newIndex >= this.size) {
      throw new RangeError('Index out of bounds');
    }

    const items = Array.from(this);
    const [item] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, item);

    this.clear();
    for (const item of items) {
      this.add(item);
    }
  }

  getIndex(item: T): number {
    let index = 0;
    for (const currentItem of this) {
      if (currentItem === item) {
        return index;
      }
      index++;
    }
    return -1; // Item not found
  }

  // getItem(index: number): T | undefined {
  //   if (index < 0 || index >= this.size) {
  //     throw new RangeError('Index out of bounds');
  //   }
  //   return Array.from(this)[index];
  // }
}