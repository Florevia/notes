# Vue 中路由的使用

## 核心概念

- **Router View (`<router-view>`)**: 路由组件的占位符，渲染当前路由匹配的组件。
- **Router Link (`<router-link>`)**: 用于创建导航链接。
- **Routes**: 路由配置数组，定义 path 和 component 的映射。

## 基本使用

```javascript
import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import About from "./views/About.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

app.use(router);
```

## 路由传参

1. **Params** (动态路由): `/user/:id` -> `route.params.id`
2. **Query**: `/search?q=vue` -> `route.query.q`

## 导航守卫 (Navigation Guards)

- **全局守卫**: `router.beforeEach`, `router.afterEach`. (用于权限校验)
- **路由独享守卫**: `beforeEnter`.
- **组件内守卫**: `beforeRouteEnter`, `beforeRouteUpdate`, `beforeRouteLeave`.

## 路由懒加载

```javascript
component: () => import("./views/About.vue");
```
