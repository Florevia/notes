# webpack

## webpack 扩展入口

- configureWebpack
- chainWebpack

```js
// webpack.config.js
module.exports = {
  configureWebpack: (config) => {
    if (process.env.NODE_ENV === "production") {
      config.devtool = false;
    }
  },
};
```

```js
// webpack.config.js
module.exports = {
  chainWebpack: (config) => {
    // 找到名为 'svg' 的规则，清空默认 loader，再换成你要的 loader
    config.module.rule("svg").uses.clear();
    config.module
      .rule("svg")
      .use("svg-inline-loader")
      .loader("svg-inline-loader");
  },
};
```

- 只想“加点东西”（alias、devtool、externals、加个插件）：优先 configureWebpack。
- 想“改 Vue CLI 内置的东西”（改某个现成 rule 的 options、删/换 loader、tap 进某个已存在 plugin）：用 chainWebpack。
- 两个 可以同时写，不冲突（按需组合）。

## webpack.config.js

```js
const path = require("path");
const { VueLoaderPlugin } = require("vue-loader"); // 导入 VueLoaderPlugin
const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // 导入 CleanWebpackPlugin
const HtmlWebpackPlugin = require("html-webpack-plugin"); // 导入 html-webpack-plugin
const { DefinePlugin } = require("webpack"); // 导入 DefinePlugin
// 导出配置对象
module.exports = {
  mode: "development", // 设置模式
  entry: "xxx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "xxx",
    clean: true, // 每次构建前清空 output 目录
  },
  devServer: {
    port: 8080,
    host: "localhost",
    hmr: true, // 启用 HMR
    open: true, // 启动后自动打开浏览器
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      extensions: [".js", ".json", ".vue"], // 自动解析扩展名
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader", "postcss-loader"], // postcss 的能力完全由插件决定，所以必须配合插件使用
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader", "postcss-loader", "less-loader"],
      },
      {
        test: /\.(png|jpg|gif|svg)/,
        type: "asset", // asset 模块类型
        parser: {
          dateUrlCondition: {
            maxSize: 10 * 1024, // 小于 10kb 的图片会被 base64 编码
          },
        },
        generator: {
          filename: "img/[name]_[hash:8][ext]", // 输出文件名(占位符)
        },
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"), // 指定模板文件
      title: "My App", // 设置生成 HTML 的 title
    }),
    new DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production"),
      },
      "global value": JSON.stringify("global value"), // console.log(global value) = global value
    }),
  ],
};

// post.config.js
module.exports = {
  plugins: [require("postcss-preset-env")],
};
```

## 抽取公共部分

```js
// webpack.common.js
module.exports = {
  entry: "xxx",
  output: {},
  devServer: {},
  resolve: {
    alias: {},
  },
  module: {
    rules: [],
  },
  plugins: [],
};

// webpack.dev.js
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common.js");
// 合并配置
module.exports = merge(commonConfig, {
  mode: "development",
  devtool: "inline-source-map",
});

// webpack.prod.js
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common.js");
// 合并配置
module.exports = merge(commonConfig, {
  mode: "production",
  devtool: "source-map",
});
```
