let a = 1;
let b = a++ + ++a;
// 先用后加1 + 先加后用3
console.log(a, b);
// 3 4

let x = 5;
let y = x++ * 2 + ++x - x++;
console.log(x, y); // x = ?, y = ?
// 8 10
