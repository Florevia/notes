# RBAC

基于用户角色（Role-Based Access Control）动态生成菜单和路由。

## 目的

1. 安全性：不该看的页面，用户即使在浏览器地址栏手动输入 URL 也无法访问（因为路由根本没注册）。

2. 体验：菜单栏（Sidebar）应该根据权限自动生成，只显示用户能看到的模块。

## 方案

目前最主流、工业级的实现方案，通常分为：

- 前端控制（静态路由表过滤）
- 后端控制（返回路由结构）

> 这里以最常见的 **前端维护路由表 + 后端返回权限标识** 为例进行讲解

## 思路

登录后获取后端返回的权限列表，过滤出符合权限的路由表，使用 `router.addRoute()` 动态添加到路由实例中，防止用户手动输入 URL 访问未授权页面。

## 流程

1. **Login**：登录成功，拿到 Token，存 `Cookie` 或 `LocalStorage`。

2. **beforeEach**：页面跳转（或刷新），进入全局前置守卫。

3. **GetInfo**：判断是否有 Token 但无用户信息（如 Roles）。如果没有，调用 `getUserInfo` 接口。

4. **GenerateRoutes**：根据后端返回的 roles（如 ['admin', 'editor']），对比前端写的 asyncRoutes（动态路由表），过滤出当前用户能访问的路由。

5. **AddRoute**：调用 `router.addRoute()` 将过滤好的路由动态添加到 Router 实例中。

6. **Render**：结合 Vuex/Pinia 中的路由数据，渲染左侧菜单。

## 具体代码实现

1. **第一步：定义路由表结构**

   我们要将路由分为两部分：
   - `constantRoutes` (静态路由)：所有人都可见，如登录页、404、首页。

   - `asyncRoutes` (动态路由)：需要权限筛选的路由，关键是在 `meta` 中配置 `roles`。

   ```js
   // router/routes.js

    // 1. 静态路由
    export const constantRoutes = [
      { path: '/login', component: () => import('@/views/login/index'), hidden: true },
      { path: '/404', component: () => import('@/views/404'), hidden: true },
      { path: '/', component: Layout, redirect: '/dashboard', children: [...] }
    ];

    // 2. 动态路由 (核心)
    export const asyncRoutes = [
      {
        path: '/permission',
        component: Layout,
        meta: {
          title: '权限管理',
          roles: ['admin', 'editor'] // 只有 admin 和 editor 能看
        },
        children: [
          {
            path: 'page',
            component: () => import('@/views/permission/page'),
            meta: {
              title: '页面权限',
              roles: ['admin'] // 只有 admin 能看
            }
          }
        ]
      },
      // 3. 重要：404 页面一定要放在最后动态添加！
      { path: '/:pathMatch(.*)*', redirect: '/404', hidden: true }
    ];
   ```

2. **第二步：Vuex/Pinia 状态管理**

   需要一个 Store 来专门处理路由过滤逻辑。

   ```js
   // store/modules/permission.js
   import { asyncRoutes, constantRoutes } from "@/router/routes";

   // 递归过滤函数
   function filterAsyncRoutes(routes, roles) {
     const res = [];
     routes.forEach((route) => {
       const tmp = { ...route };
       // 判断当前路由是否有权限
       if (hasPermission(roles, tmp)) {
         if (tmp.children) {
           // 递归过滤子路由
           tmp.children = filterAsyncRoutes(tmp.children, roles);
         }
         res.push(tmp);
       }
     });
     return res;
   }

   // Action
   actions: {
      generateRoutes({ commit }, roles) {
         return new Promise(resolve => {
            let accessedRoutes;
            if (roles.includes('admin')) {
               accessedRoutes = asyncRoutes || []; // admin拥有所有权限
            } else {
               accessedRoutes = filterAsyncRoutes(asyncRoutes, roles);
            }
            commit('SET_ROUTES', accessedRoutes);
            resolve(accessedRoutes); // 将处理好的路由返回出去
         });
      }
   }
   ```

3. **第三步：在全局守卫中调用 (router.beforeEach)**

```js
// permission.js
import router from "./router";
import store from "./store";
import { getToken } from "@/utils/auth";

const whiteList = ["/login"]; // 白名单

router.beforeEach(async (to, from, next) => {
  const hasToken = getToken();

  if (hasToken) {
    if (to.path === "/login") {
      // 已登录还去登录页，重定向到首页
      next({ path: "/" });
    } else {
      // 判断是否已拉取完用户信息（判断 roles 是否存在）
      const hasRoles = store.getters.roles && store.getters.roles.length > 0;

      if (hasRoles) {
        next(); // 有权限，直接放行
      } else {
        try {
          // 1. 获取用户信息，拿到 roles
          const { roles } = await store.dispatch("user/getInfo");

          // 2. 根据 roles 生成可访问的路由表
          const accessRoutes = await store.dispatch(
            "permission/generateRoutes",
            roles,
          );

          // 3. 动态添加路由 (核心 API)
          accessRoutes.forEach((route) => {
            router.addRoute(route);
          });

          // 4. 确保路由添加完成 (Hack 写法)
          // set the replace: true so the navigation will not leave a history record
          next({ ...to, replace: true });
        } catch (error) {
          // 失败（如 Token 过期），重置 Token 并去登录页
          await store.dispatch("user/resetToken");
          next(`/login?redirect=${to.path}`);
        }
      }
    }
  } else {
    // 没有 Token
    if (whiteList.indexOf(to.path) !== -1) {
      next();
    } else {
      next(`/login?redirect=${to.path}`);
    }
  }
});
```
