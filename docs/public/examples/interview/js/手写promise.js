Promise.myAll = function (promises) {
  return new Promise((resolve, reject) => {
    // 1. 应该加 ! 取反，如果不是数组才报错
    if (!Array.isArray(promises)) {
      return reject(new TypeError("参数必须是数组"));
    }

    if (promises.length === 0) {
      return resolve([]);
    }

    let count = 0;
    let res = [];
    let l = promises.length;

    promises.forEach((p, index) => {
      // 2. Promise.resolve 是静态方法，前面不能加 new
      Promise.resolve(p)
        .then((value) => {
          res[index] = value;
          count++;

          if (count === l) {
            return resolve(res);
          }
        })
        .catch((err) => reject(err)); // 或者直接简写成 .catch(reject)
    });
  });
};

Promise.myAllSettled = function (promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return this.reject(new Error("xxx"));
    }

    if (promises.length === 0) {
      return this.resolve([]);
    }

    let count = 0;
    let res = [];
    let l = promises.length;

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((value) => {
          res[index] = { status: "fulfilled", value: value };
          count++;
        })
        .catch((err) => {
          res[index] = { status: "rejected", reason: err };
          count++;
        })
        .finally(() => {
          if (count === l) return resolve(res);
        });
    });
  });
};
