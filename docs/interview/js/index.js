// counter.js
let count = 1;
function increment() {
  count++;
}
module.exports = {
  get count() {
    return count;
  },
  increment,
};
