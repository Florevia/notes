// /**
//  * Definition for a binary tree node.
//  * function TreeNode(val, left, right) {
//  *     this.val = (val===undefined ? 0 : val)
//  *     this.left = (left===undefined ? null : left)
//  *     this.right = (right===undefined ? null : right)
//  * }
//  */
// /**
//  * @param {TreeNode} root
//  * @param {number} targetSum
//  * @return {number}
//  */
// var pathSum = function (root, targetSum) {
//   // Map 用于存储前缀和出现的次数
//   // key：前缀和， value：出现的次数
//   const prefixSumMap = new Map();

//   // 初始化：前缀和为0的路径默认有一条（用于处理从根节点开始就符合条件的路径）
//   prefixSumMap.set(0, 1);

//   const dfs = (node, currSum) => {
//     // 递归出口
//     if (!node) return 0;

//     let count = 0;
//     currSum += node.val;

//     // 1. 检查是否存在我们需要的前缀和
//     // 如果currSum - targetSum存在，说明从某个祖先节点到当前的路径和为targetSum
//     if (prefixSumMap.has(currSum - targetSum)) {
//       count += prefixSumMap.get(currSum - targetSum);
//     }

//     // 2. 将当前前缀和存入到Map中，递归子树
//     prefixSumMap.set(currSum, (prefixSumMap.get(currSum) || 0) + 1);

//     count += dfs(node.left, currSum);
//     count += dfs(node.right, currSum);

//     // 3. 回溯：在返回父节点前，移除当前路径的前缀和
//     // 这是为了防止左子树的前缀和干扰到右子树的计算
//     prefixSumMap.set(currSum, prefixSumMap.get(currSum) - 1);

//     return count;
//   };
//   return dfs(root, 0);
// };

/**
 * Definition for a binary tree node.
 * function TreeNode(val) {
 * this.val = val;
 * this.left = this.right = null;
 * }
 */
/**
 * @param {TreeNode} root
 * @param {TreeNode} p
 * @param {TreeNode} q
 * @return {TreeNode}
 */
var lowestCommonAncestor = function (root, p, q) {
  // 1. 终止条件 (Base Case)
  // 如果走到空节点，返回 null
  // 如果当前节点就是 p 或者 q，说明找到了其中一个，直接返回当前节点
  if (root === null || root === p || root === q) {
    return root;
  }

  // 2. 递 (Recursive Step)
  // 去左子树找
  const left = lowestCommonAncestor(root.left, p, q);
  // 去右子树找
  const right = lowestCommonAncestor(root.right, p, q);

  // 3. 归 (Logic after recursion)

  // 如果左右都返回了非空值，说明 p 和 q 分别在两边
  // 当前节点 root 就是它们的最近公共祖先
  if (left !== null && right !== null) {
    return root;
  }

  // 如果只有一边找到了（或者两边都没找到），返回找到的那一边
  // (如果 left 有值就返 left，否则返 right——即使 right 也是 null)
  return left !== null ? left : right;
};
