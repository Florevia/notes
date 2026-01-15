// console.log(a); // 输出：function a() {}

// (证明：函数声明提升 覆盖了 变量提升，或者说变量声明被忽略了)
// var a = 10;
// function a() {}
// console.log(a); // 输出：10
// (执行阶段：var a = 10 执行赋值，把 a 变成了数字)

console.log(global);
export default 1;
