// 测试用例
const data = [1, [2, [3, [4, 5]]]];
console.log(myFlat1(data, Infinity)); // [1, 2, [3, [4, 5]]]
console.log(myFlat2(data)); // [1, 2, [3, [4, 5]]]
console.log(myFlat1(data, 2)); // [1, 2, 3, [4, 5]]

// 方法一：reduce
function myFlat1(arr, depth = 1) {
  if (!Array.isArray(arr)) return arr;

  return arr.reduce((acc, cur) => {
    if (Array.isArray(cur) && depth > 0) {
      return acc.concat(myFlat1(cur, depth - 1));
    } else {
      return acc.concat(cur);
    }
  }, []);
}

// 方法二：concat
function myFlat2(arrs) {
  if (!Array.isArray(arrs)) return arrs;
  let res = [];

  for (let arr of arrs) {
    if (!Array.isArray(arr)) {
      res.push(arr);
    } else {
      res = res.concat(myFlat2(arr));
    }
  }
  return res;
}
