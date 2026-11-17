// async function foo() {
//   console.log(1);
//   await console.log(2);
//   console.log(3);
// }

// console.log(4);
// foo();
// console.log(5);

// 4 1 2 5 3

// async function async1() {
//   console.log("a");
//   await async2();
//   console.log("b");
// }

// async function async2() {
//   console.log("c");
// }

// console.log("d");

// setTimeout(() => {
//   console.log("e");
// }, 0);

// async1();

// new Promise((resolve) => {
//   console.log("f");
//   resolve();
// }).then(() => {
//   console.log("g");
// });

// console.log("h");

// d a c f h b g e

async function foo() {
  console.log(1);
  const a = await bar();
  console.log(a);
}

async function bar() {
  console.log(2);
  return 3;
}

foo();

new Promise((resolve) => {
  console.log(4);
  resolve(5);
})
  .then((val) => {
    console.log(val);
  })
  .then(() => {
    console.log(6);
  });

console.log(7);

// 1 2 4 7 3 5 6

// await 右边的表达式是同步执行的，await 之后的代码才会被丢进微任务队列
// new Promise(executor) 里的 executor 是同步执行的
