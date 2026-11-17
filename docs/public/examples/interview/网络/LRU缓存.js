// 定义双向链表节点
class ListNode {
  constructor(key, value) {
    // value：这是缓存真正要存的数据。
    // key：这是数据的唯一标识。
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

/**
 * @param {number} capacity
 */
var LRUCache = function (capacity) {
  this.capacity = capacity;
  this.map = new Map(); // 哈希表：Key -> Node

  // 建立虚拟头尾节点
  this.head = new ListNode(-1, -1);
  this.tail = new ListNode(-1, -1);

  // 初始化链表： head <-> tail
  this.head.next = this.tail;
  this.tail.prev = this.head;
};

/** * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function (key) {
  if (!this.map.has(key)) return -1;

  const node = this.map.get(key);

  // 关键步骤：因为被访问了，所以它是“最新”的，要挪到头部去
  this.moveToHead(node);

  return node.value;
};

/** * @param {number} key
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function (key, value) {
  if (this.map.has(key)) {
    // 1. 如果 key 存在，更新 value，并挪到头部
    const node = this.map.get(key);
    node.value = value;
    this.moveToHead(node);
  } else {
    // 2. 如果 key 不存在，创建新节点
    const newNode = new ListNode(key, value);
    this.map.set(key, newNode);
    this.addToHead(newNode); // 放到头部

    // 3. 检查容量，如果满了，淘汰尾部
    if (this.map.size > this.capacity) {
      this.removeLRUItem();
    }
  }
};

// --- 以下是 3 个辅助函数 (Helper Functions) ---
// 这也是让代码清晰的关键，面试时把复杂逻辑拆出去写

// 将节点移动到头部（= 先删除 + 再添加到头）
LRUCache.prototype.moveToHead = function (node) {
  this.removeNode(node);
  this.addToHead(node);
};

// 核心指针操作：从链表中删除一个节点
LRUCache.prototype.removeNode = function (node) {
  node.prev.next = node.next;
  node.next.prev = node.prev;
};

// 核心指针操作：添加到虚拟头节点后面
LRUCache.prototype.addToHead = function (node) {
  node.prev = this.head;
  node.next = this.head.next;
  this.head.next.prev = node;
  this.head.next = node;
};

// 淘汰最久未使用的（即虚拟尾节点的前一个）
LRUCache.prototype.removeLRUItem = function () {
  const tailNode = this.tail.prev; // 真正的尾巴
  this.removeNode(tailNode); // 从链表删
  this.map.delete(tailNode.key); // 从 Map 删（注意：这里需要用到 node.key）
};
