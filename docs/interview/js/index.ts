function myDeepClone(obj, map = new Map()) {
  // 基本数据类型
  if (typeof obj !== "object" || typeof obj === "null") {
    return obj;
  }

  // 处理正则和时间
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Date) return new Date(obj);

  // 处理循环引用
  if (map.has(obj)) return map.get(obj); // 直接返回 map 里存好的那个新对象

  // 初始化副本：利用 constructor 保证类型一致 (Array 或 Object 或 Map 等)
  const target = obj.constructor();

  // 存入map，防止循环引用
  map.set(obj, target);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      target[key] = myDeepClone(obj[key], map);
    }
  }

  return target;
}
