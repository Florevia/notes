// function myInstanceof(left, right) {
//   // 1. 容错处理：如果左侧是基本数据类型（如字符串、数字），直接返回 false
//   if (typeof left !== "object" || left === null) return false;

//   // 右侧必须是一个函数
//   if (typeof right !== "function") {
//     throw new TypeError("Right-hand side of instanceof must be a function");
//   }

//   // 2. 获取右侧构造函数的原型
//   const prototype = right.prototype;

//   // 3. 获取左侧实例对象的隐式原型 (推荐使用 Object.getPrototypeOf，比 **proto** 标准)
//   let proto = Object.getPrototypeOf(left);

//   // 4. 顺着原型链不断往上找
//   while (true) {
//     // 找到了尽头还没找到，说明不在原型链上
//     if (proto === null) return false;

//     // 找到了！
//     if (proto === prototype) return true;

//     // 继续顺着原型链往上爬
//     proto = Object.getPrototypeOf(proto);
//   }
// }

// // 测试用例
// console.log(myInstanceof([], Array)); // true
// console.log(myInstanceof({}, Object)); // true
// console.log(myInstanceof("hello", String)); // false (基本类型判断为 false)
