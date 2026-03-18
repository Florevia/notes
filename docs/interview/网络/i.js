// // 考察this指向
// a = function () {
//   return {
//     b: function () {
//       console.log(this);
//     },
//     c: () => {
//       console.log(this);
//     },
//   };
// };

// d = a.call({});
// console.log(d.b(), d.c());

// // { b: [Function: b], c: [Function: c] }
// // {}
// // undefined undefined

// 考察浏览器的事件循环
// let wait = (ms) => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve();
//       console.log(1);
//     }, ms);
//     console.log(0);
//   });
// };

// wait(0).then(() => {
//   console.log(6);
// });

// Promise.resolve()
//   .then(() => {
//     console.log(2);
//   })
//   .then(() => {
//     console.log(3);
//   });

// Promise.resolve().then(() => {
//   console.log(4);
// });

// console.log(5);

// // 0
// // 5
// // 2
// // 4
// // 3
// // 1
// // 6

// // 考察this指向
// const obj = {
//   name: "Alice",
//   greet: function () {
//     console.log(this.name);
//   },
// };
// const fn = obj.greet;
// fn(); // 输出什么？
// obj.greet(); // 输出什么？

// undefined
// Alice

// const obj = {
//   name: "Bob",
//   outer: function () {
//     const inner = () => {
//       console.log(this.name);
//     };
//     inner();
//   },
// };
// obj.outer();

// // Bob

// const obj = {
//   name: "Charlie",
//   sayA: function () {
//     setTimeout(function () {
//       console.log(this.name);
//     }, 0);
//   },
//   sayB: function () {
//     setTimeout(() => {
//       console.log(this.name);
//     }, 0);
//   },
// };

// obj.sayA(); // 输出什么？
// obj.sayB(); // 输出什么？

// // undefined
// // Charlie

// function foo() {
//   return () => {
//     console.log(this.x);
//   };
// }

// const arrow1 = foo.call({ x: 1 });
// const arrow2 = foo.call({ x: 2 });

// arrow1(); // 输出什么？
// arrow2(); // 输出什么？
// arrow1.call({ x: 3 }); // 输出什么？

// 1
// 2
// 1

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

obj.methods.getName1()(); // 输出什么？
obj.methods.getName2()(); // 输出什么？
obj.methods.getName1.call(obj)(); // 输出什么？
obj.methods.getName2.call(obj)(); // 输出什么？

// 在浏览器中this= globalThis
// 在node 中this= global， var name = "global" 不会挂载到global 上（只有浏览器的 var 才挂 window）

// 在浏览器中答案为：
// global
// methods
// global
// obj

// 在node 中答案为：undefined, methods, undefined, obj
