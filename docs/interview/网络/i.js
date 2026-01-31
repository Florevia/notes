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
