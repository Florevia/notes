class Parent {
  name = (function () {
    console.log("parent init");
    return "parent";
  })();

  constructor() {
    console.log("parent constructor");
    this.run();
    this.runA();
  }

  run() {
    console.log("parent run");
  }

  runA() {
    console.log("parent runA");
  }
}

class Child extends Parent {
  name = (function () {
    console.log("child init");
    return "child";
  })();

  innerName: undefined | number;

  constructor() {
    super();
    console.log("child constructor");
    console.log(this.innerName);
  }

  run() {
    this.innerName = 1;
    console.log("child run");
  }

  runA() {
    console.log("child runA");
  }
}

new Child();

// parent init
// parent constructor
// child run
// child runA
// child init
// child constructor
// undefined
