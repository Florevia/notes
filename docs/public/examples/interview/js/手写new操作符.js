function myNew(constructor, ...args) {
  const target = Object.create(constructor.prototype);

  const res = constructor.apply(target, args);

  if ((typeof res === "object" && res !== null) || typeof res === "function") {
    return res;
  }

  return target;
}

// 验证
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const person = myNew(Person, "lilin", 18);
console.log(person);
