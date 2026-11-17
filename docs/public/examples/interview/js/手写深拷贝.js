const deepClone = (obj, map = new Map()) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Date) return new Date(obj);

  if (map.has(obj)) return map.get(obj);

  const res = new obj.constructor();
  map.set(obj, res);

  if (obj instanceof Map) {
    obj.forEach((value, key) => {
      res.set(key, deepClone(value, map));
    });
    return res;
  }

  if (obj instanceof Set) {
    obj.forEach((value) => {
      res.add(deepClone(value, map));
    });
    return res;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      res[key] = deepClone(obj[key], map);
    }
  }

  return res;
};
