const url = "https://example.com?page=1&size=10&name=lin";

function parseQuery(url) {
  const obj = {};

  // 先拿到 ? 后面的部分
  const queryString = url.split("?")[1];
  if (!queryString) return obj;

  // 去掉 hash
  const query = queryString.split("#")[0];

  // 按 & 切开
  const pairs = query.split("&");

  for (let i = 0; i < pairs.length; i++) {
    const item = pairs[i];
    if (!item) continue;

    const parts = item.split("=");
    const key = decodeURIComponent(parts[0]);
    const value = parts[1] ? decodeURIComponent(parts[1]) : "";

    obj[key] = value;
  }

  return obj;
}

function parseQuery(url) {
  const res = {};
  const query = url.split("?")[1]?.split("#")[0];

  if (!query) return res;

  query.split("&").forEach((item) => {
    const [key, value = ""] = item.split("=");
    res[decodeURIComponent(key)] = decodeURIComponent(value);
  });

  return res;
}
