// console.log("A");

// setTimeout(() => {
//   console.log("B");
//   Promise.resolve().then(() => {
//     console.log("C");
//   });
// }, 0);

// Promise.resolve().then(() => {
//   console.log("D");
//   setTimeout(() => {
//     console.log("E");
//   }, 0);
// });

// console.log("F");

// // 答案：
// // A
// // F
// // D
// // B
// // C
// // E

// async function foo() {
//   console.log(1);
//   const result = await bar();
//   console.log(2);
// }

// async function bar() {
//   console.log(3);
// }

// console.log(4);
// foo();
// console.log(5);

// // 答案：
// // 4
// // 1
// // 3
// // 5
// 2

// Promise.resolve().then(() => {
//   console.log(1);
//   Promise.resolve().then(() => {
//     console.log(2);
//     Promise.resolve().then(() => {
//       console.log(3);
//     });
//   });
// });

// Promise.resolve().then(() => {
//   console.log(4);
// });

// setTimeout(() => {
//   console.log(5);
// }, 0);

// 答案：
// 1
// 4
// 2
// 3
// 5

async function async1() {
  console.log("A");
  await async2();
  console.log("B");
}

async function async2() {
  console.log("C");
}

console.log("D");

setTimeout(() => {
  console.log("E");
}, 0);

async1();

new Promise((resolve) => {
  console.log("F");
  resolve();
}).then(() => {
  console.log("G");
});

console.log("H");

// 答案： D
// A;
// C;
// F;
// H;
// B;
// G;
// E;
