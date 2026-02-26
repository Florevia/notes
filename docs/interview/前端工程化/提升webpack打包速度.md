# 提升webpack打包速度

## 1. 开启缓存

- 开启缓存可以避免重复编译，提高打包速度。
- 可以在 `webpack.config.js` 中配置 `cache: true` 开启缓存。

## 2. 减少处理模块

- 使用 `exclude` 或 `include` 配置项，只对需要处理的模块进行编译。
- 避免在 `node_modules` 中处理模块，因为这些模块通常是已经编译好的，没有必要重复处理。

## 3. 按需加载 和 tree shaking

- 利用 Webpack 的代码分割功能（Code Splitting），将代码按需加载。
- 开启 tree shaking 可以移除未被使用的代码，进一步减小打包体积。

## 4. 并行处理

- 开启并行处理可以利用多核 CPU 并行编译，进一步提升打包速度。
- 可以在 `webpack.config.js` 中配置 `parallel: true` 开启并行处理。