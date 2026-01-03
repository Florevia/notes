interface MyIterator<T> {
  next(): MyIteratorResult<T>;
}

interface MyIteratorResult<T> {
  value: T;
  done: boolean;
}

let value = 1;
const iterator: MyIterator<number | undefined> = {
  next() {
    return {
      value: value > 3 ? undefined : value,
      done: value++ > 3,
    };
  },
};

console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());
