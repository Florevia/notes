// 考察this指向
a = function () {
  return {
    b: function () {
      console.log(this);
    },
    c: () => {
      console.log(this);
    },
  };
};

d = a.call({});
console.log(d.b(), d.c());

// { b: [Function: b], c: [Function: c] }
// {}
// undefined undefined

//-----------------------------------------------------

// 考察浏览器的事件循环
let wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
      console.log(1);
    }, ms);
    console.log(0);
  });
};

wait(0).then(() => {
  console.log(6);
});

Promise.resolve()
  .then(() => {
    console.log(2);
  })
  .then(() => {
    console.log(3);
  });

Promise.resolve().then(() => {
  console.log(4);
});

console.log(5);

// 0
// 5
// 2
// 4
// 3
// 1
// 6

// -----------------------------------------------------------

const obj1 = {
  name: "Bob",
  outer: function () {
    const inner = () => {
      console.log(this.name);
    };
    inner();
  },
};
obj1.outer();

// Bob

// -----------------------------------------------------------

const obj2 = {
  name: "Charlie",
  sayA: function () {
    setTimeout(function () {
      console.log(this.name);
    }, 0);
  },
  sayB: function () {
    setTimeout(() => {
      console.log(this.name);
    }, 0);
  },
};

obj2.sayA();
obj2.sayB();

// undefined
// Charlie

// -----------------------------------------------------------

function foo() {
  return () => {
    console.log(this.x);
  };
}

const arrow1 = foo.call({ x: 1 });
const arrow2 = foo.call({ x: 2 });

arrow1();
arrow2();
arrow1.call({ x: 3 });

// 1
// 2
// 1
// return 的时候，箭头函数才完成定义，箭头函数的this才确定

// -----------------------------------------------------------

var name = "global";

const obj = {
  name: "obj",
  methods: {
    name: "methods",
    getName1: function () {
      return function () {
        console.log(this.name);
      };
    },
    getName2: function () {
      return () => {
        console.log(this.name);
      };
    },
  },
};

obj.methods.getName1()();
obj.methods.getName2()();
obj.methods.getName1.call(obj)();
obj.methods.getName2.call(obj)();

// 在浏览器中this= globalThis
// 在node 中this= global， var name = "global" 不会挂载到global 上（只有浏览器的 var 才挂 window）

// 在浏览器中答案为：
// global
// methods
// global
// obj

// 在node 中答案为：undefined, methods, undefined, obj
