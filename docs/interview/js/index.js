Promise.myAll = function (promises) {
  return new Promise((resolve, reject) => {
    // 检查是否是数组
    if (!Array.isArray(promises)) {
      return reject(new TypeError("Argument must be an array"));
    }

    // 检查是否是空数组
    if (promises.length === 0) {
      return resolve([]);
    }

    // 处理逻辑
    let res = [];
    let count = 0;
    let l = promises.length;

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((value) => {
          res[index] = value;
          count++;

          if (count === l) {
            return resolve(res);
          }
        })
        .catch((err) => {
          return reject(err);
        });
    });
  });
};

Promise.myAllSettled = function (promises) {
  // 返回一个新promise
  return new Promise((resolve, rejected) => {
    // 检查是否是数组
    if (!Array.isArray(promises)) {
      return rejected(new TypeError("Argument must be an array"));
    }

    // 检查是否是空数组
    if (promises.length === 0) {
      return resolve([]);
    }

    // 处理逻辑
    let res = [];
    let count = 0;
    let l = promises.length;

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((value) => {
          res[index] = { status: "fulfilled", value: value };
          count++;
          if (count === l) resolve(res);
        })
        .catch((err) => {
          res[index] = { status: "rejected", reason: err };
          count++;
          if (count === l) resolve(res);
        });
    });
  });
};

Promise.myRace = function (promises) {
  return new Promise((resolve, reject) => {
    // 检查是否是数组
    if (!Array.isArray(promises)) {
      return reject(new TypeError("Argument must be an array"));
    }

    // 检查是否是空数组
    if (promises.length === 0) {
      return resolve([]);
    }

    // 处理逻辑
    let res = [];

    promises.forEach((p) => {
      Promise.resolve(p).then(resolve, reject);
    });
  });
};
