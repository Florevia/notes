# RBAC

RBAC（Role-Based Access Control，基于角色的访问控制）的核心关系是：**用户 → 角色 → 权限**。基于角色动态生成菜单和路由，是 RBAC 在前端的应用之一，不是完整的权限防护方案。

本文先介绍 Vue Router + Vuex/Pinia 的动态路由流程，再补充前后端权限边界、接口与数据授权、权限生命周期，以及越权测试。

## 目的

1. 导航限制：未授权页面不注册到路由，限制用户通过正常页面导航或手动输入 URL 进入相应页面。**这不代表对应接口和数据已经受到保护。**

2. 体验：菜单栏（Sidebar）根据权限自动生成，只显示用户能看到的模块。

3. 业务安全：后端独立校验每次请求的身份、操作权限和数据范围。即使用户绕过路由或隐藏按钮直接调用 API，也不能越权。

## 方案

动态路由的常见生成方案有两种：

- 前端维护路由表，后端返回角色或权限标识，前端过滤路由。
- 后端返回当前用户可见的菜单或路由结构，前端通过受控的组件映射生成路由。

> 这里以 **前端维护路由表 + 后端返回授权信息** 为例。下面的基础示例按角色过滤，后文进一步说明如何改为按细粒度权限过滤。无论由哪一端生成路由，后端都必须单独执行接口和数据授权。

## 思路

登录后获取后端返回的授权信息，过滤出符合权限的路由表，使用 `router.addRoute()` 动态添加到路由实例中。前端据此控制页面、菜单和操作入口；后端在每次业务请求中做最终授权裁决。

## 流程

1. **Login**：建立登录会话。Bearer Token 方案可将 Access Token 放在内存，Refresh Token 放在由后端设置的 HttpOnly Cookie；Session/BFF 方案由浏览器携带会话 Cookie。不要把普通 Cookie 和 LocalStorage 当成同等安全的存储，详见后文会话安全。

2. **beforeEach**：页面跳转（或刷新），进入全局前置守卫。

3. **GetInfo**：使用独立的 `permissionsLoaded` 状态判断授权信息是否已初始化；未初始化时调用 `getUserInfo` 或 `/me` 接口。角色为空也可以是合法结果。HttpOnly Cookie 无法被 JS 读取，采用该方案时通过会话接口恢复身份。

4. **GenerateRoutes**：根据后端返回的 roles（如 ['admin', 'editor']），对比前端写的 asyncRoutes（动态路由表），过滤出当前用户能访问的路由。

5. **AddRoute**：调用 `router.addRoute()` 将过滤好的路由动态添加到 Router 实例中。

6. **Render**：结合 Vuex/Pinia 中的路由数据，渲染左侧菜单。

## 具体代码实现

1. **第一步：定义路由表结构**

   我们要将路由分为两部分：
   - `constantRoutes`（静态路由）：固定注册的路由。**静态不等于公开**：登录页和错误页可以公开，首页通常仍需要登录，公开页面应显式标记 `meta.public`。

   - `asyncRoutes`（动态路由）：需要权限筛选的路由，基础示例在 `meta` 中配置 `roles`。受保护业务页面漏配权限时默认拒绝；纯布局节点可显式标记 `layoutOnly`，仅在存在可见子路由时保留。

   ```js
   // router/routes.js

    // 1. 静态路由
    export const constantRoutes = [
      { path: '/login', component: () => import('@/views/login/index'), meta: { public: true }, hidden: true },
      { path: '/403', component: () => import('@/views/403'), meta: { public: true }, hidden: true },
      { path: '/404', component: () => import('@/views/404'), meta: { public: true }, hidden: true },
      // 首页需要登录；具体 children 省略
      { path: '/', component: Layout, meta: { requiresAuth: true }, redirect: '/dashboard', children: [...] },
      // 保留原始 URL，先恢复身份并注册动态路由，再判断是否真的不存在
      // Vue Router 4 按路径匹配优先级选择路由，不要求通配符最后注册
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/404'), meta: { requiresAuth: true }, hidden: true }
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
      }
    ];
   ```

2. **第二步：Vuex/Pinia 状态管理**

   需要一个 Store 来专门处理路由过滤逻辑。

   ```js
   // store/modules/permission.js
   import { asyncRoutes, constantRoutes } from "@/router/routes";

   // 此角色示例约定：roles 中任意一个匹配即可，漏配默认拒绝
   function hasPermission(roles, route) {
     const requiredRoles = route.meta?.roles;
     return Array.isArray(requiredRoles)
       && requiredRoles.length > 0
       && requiredRoles.some(role => roles.includes(role));
   }

   // 递归过滤；layoutOnly 只能用于纯布局容器，不能承载业务页面
   function filterAsyncRoutes(routes, roles) {
     const res = [];
     routes.forEach((route) => {
       const tmp = { ...route };
       const layoutOnly = tmp.meta?.layoutOnly === true;
       if (!layoutOnly && !hasPermission(roles, tmp)) return;

       if (tmp.children) {
         tmp.children = filterAsyncRoutes(tmp.children, roles);
         // 示例中的父节点是菜单容器，没有可见子页面则移除
         if (tmp.children.length === 0) return;
       } else if (layoutOnly) {
         return;
       }
       res.push(tmp);
     });
     return res;
   }

   // Action
   actions: {
      generateRoutes({ commit }, roles) {
         return new Promise(resolve => {
            // 不将名为 admin 的角色隐式视为全权角色
            // 超级管理员的范围应由服务端策略显式定义
            const accessedRoutes = filterAsyncRoutes(asyncRoutes, roles);
            commit('SET_ROUTES', accessedRoutes);
            resolve(accessedRoutes); // 将处理好的路由返回出去
         });
      }
   }
   ```

3. **第三步：在全局守卫中调用 (router.beforeEach)**

以下是 Vue Router 4 守卫的接入示例。Store 的状态、action 和 mutation 需按项目实现，不能只复制守卫而省略初始化和清理逻辑。

`auth/ensureInitialized` 的约定：

- 已初始化时直接返回；否则共享一个初始化 Promise，避免并发重复请求或注册。
- 调用 `/me` 恢复身份和角色，执行 `permission/generateRoutes`，再注册路由：
  `accessRoutes.forEach(route => removers.push(router.addRoute(route)))`。
- 成功后设置独立的 `permissionsLoaded = true`；角色为空也算初始化成功。
- 保存移除函数 `removers`。退出、换号、切租户时调用它们，并清空身份、权限、菜单和业务缓存。
- 初始化期间若身份发生变化，取消旧请求或通过身份版本丢弃旧结果，不允许旧结果再次注册路由或写入 Store。
- `/me` 使用 Bearer Token 或会话 Cookie 认证，不依赖 JS 读取 HttpOnly Cookie。

```js
// permission.js
import router from "./router";
import store from "./store";

router.beforeEach(async (to) => {
  // public 需要路由链明确标记，不能通过漏配权限推断公开
  if (to.matched.length > 0
      && to.matched.every(record => record.meta.public === true)) {
    return true;
  }

  const wasLoaded = store.getters.permissionsLoaded;
  try {
    await store.dispatch("auth/ensureInitialized");

    if (!wasLoaded) {
      // 刷新动态路由时，第一次匹配可能是 NotFound；注册后按原 URL 重新匹配
      return { path: to.path, query: to.query, hash: to.hash, replace: true };
    }

    const roles = store.getters.roles;
    const allowed = to.matched.length > 0 && to.matched.every(record => {
      if (record.meta.public === true) return true;
      // requiresAuth：本示例中只需登录的固定路由
      if (record.meta.requiresAuth === true) return true;
      if (record.meta.layoutOnly === true) return true;
      const requiredRoles = record.meta.roles;
      return Array.isArray(requiredRoles)
        && requiredRoles.length > 0
        && requiredRoles.some(role => roles.includes(role));
    });

    return allowed ? true : { path: "/403", replace: true };
  } catch (error) {
    const status = error.response?.status;
    if (status === 401) {
      // 清理本地授权状态与动态路由；服务端会话吊销由退出接口完成
      await store.dispatch("auth/clearLocalState");
      return { path: "/login", query: { redirect: to.fullPath }, replace: true };
    }
    if (status === 403) return { path: "/403", replace: true };

    // 网络或服务异常：阻止进入未初始化页面，不降级放行，也不一律登出
    console.error("权限初始化失败", error);
    return false;
  }
});
```

注意：

- 此守卫仍然只是前端导航控制，不能替代后端授权。
- `requiresAuth` 只适用于明确“登录即可访问”的页面；不要用它跳过业务页面的权限检查。
- 父子页面的权限约定要一致；上述示例要求匹配的路由链逐级满足条件。纯布局节点不应发起敏感业务请求。
- 父路由配置 `redirect` 时，应指向过滤后仍可访问的子路由，不能跳到被移除的页面。
- 如果未授权路由没有注册，访问该 URL 会匹配 404。要区分“无权限”和“不存在”，可使用不含业务组件的受限路由元数据；不要为了显示 403 而加载无权页面的数据。
- 登录后的 `redirect` 必须校验为允许的站内目标，禁止外部 URL，并避免跳回登录页造成循环。
- 若后端返回路由结构，组件只能从前端白名单映射，不能执行后端返回的任意代码或任意远程组件地址。

## 完整权限模型：不只是角色和页面

### 认证、功能授权与数据授权

| 层次 | 回答的问题 | 示例 |
| --- | --- | --- |
| 认证 Authentication | 你是谁，会话是否有效？ | Token 对应用户 A，账号未停用 |
| 功能授权 Authorization | 你能执行什么操作？ | 用户 A 有 `order:update` |
| 数据授权 | 你能对哪些资源执行操作？ | 仅当前租户、本人负责的订单 |
| 字段权限 | 可以读取或修改哪些字段？ | 可以修改备注，不可修改成本价 |
| 业务规则 | 当前状态是否允许操作？ | 已结算的订单不能直接修改 |

**Token 有效不等于有操作权限；有操作权限不等于能操作任意数据；有权限也不能绕过业务状态约束。**

一个请求最终允许执行，可以理解为：

```text
会话有效且账号可用
  AND 当前作用域有效
  AND 具备操作权限
  AND 目标对象在允许的数据范围内
  AND 字段读写符合授权规则
  AND 业务状态允许执行
```

### 用户、角色、权限与作用域

RBAC 的典型关系：

```text
用户 ── 用户角色关系（含租户/组织作用域） ── 角色
角色 ── 角色权限关系 ── 权限标识
```

例如：

```text
财务主管角色
  ├─ order:read
  ├─ order:export
  └─ refund:approve

订单编辑角色
  ├─ order:read
  └─ order:update
```

角色是权限的集合，前端页面和按钮优先依赖权限标识，而非硬编码角色名。新增角色或调整角色权限时，通常不需要修改页面代码。

需要在设计中明确：

- 权限标识采用稳定的业务语义，如 `资源:动作`，而不是按钮名称或 URL。
- 查询、编辑、删除、导出、审批等可以分别授权，不默认捆绑。
- 多角色的授权通常取并集，但必须在当前有效租户/组织作用域内计算，不能把其它租户的角色合并进来。
- 若支持显式拒绝、角色继承或权限依赖，需要明确冲突优先级，并检查继承循环；简单项目不必引入这些机制。
- 权限目录由服务端维护，角色只能选择合法权限；未知权限标识默认拒绝。
- 租户管理员、业务管理员和平台超级管理员的范围不同，不能仅凭角色名 `admin` 统一放行。

仅靠 RBAC 通常不能表达“只能编辑本人订单”。可以在 RBAC 的操作权限上叠加所有者、部门、租户、项目成员等条件；这属于数据范围或属性/关系授权，不必为了每一种数据组合创建新角色。

## 前端权限防护怎么做

### 1. 获取统一的身份与权限快照

服务端 `/me` 可以返回：

```json
{
  "userId": "u_123",
  "tenantId": "t_001",
  "roles": ["order_editor"],
  "permissions": ["order:read", "order:update"],
  "authzVersion": "42"
}
```

- `permissions` 是当前作用域内的有效操作权限，不是所有租户权限的合集。
- `authzVersion` 用于发现权限变化，不是客户端的授权凭证；服务端不能相信客户端提交的版本就跳过授权。
- Store 维护 `permissionsLoaded`、加载中状态及共享初始化 Promise。空权限集合也算成功初始化。
- 页面拿到权限前，不渲染受保护内容，也不先请求敏感数据再隐藏。
- 返回给前端的权限是展示用快照，最终判定始终在后端。

### 2. 路由、菜单、按钮和操作逻辑使用同一规则

权限判定应显式约定 `any`（任一满足）或 `all`（全部满足），空配置默认拒绝：

```js
// permission-utils.js
export function hasPermissions(granted, required, mode = "all") {
  if (!Array.isArray(required) || required.length === 0) return false;
  if (!Array.isArray(granted)) return false;
  const owned = new Set(granted);
  if (mode === "any") return required.some(code => owned.has(code));
  if (mode === "all") return required.every(code => owned.has(code));
  return false;
}
```

业务路由可以改为：

```js
meta: {
  permissions: ["order:read"],
  permissionMode: "all"
}
```

路由过滤和守卫共同调用该函数，并保留前面的公开路由、登录路由和纯布局节点约定。路由依赖从 `roles` 改为 `permissions` 时，Store、过滤函数和守卫要一起迁移，不能只改 `meta`。

Vue 组件可以通过响应式权限控制按钮，例如：

```vue
<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { hasPermissions } from "@/utils/permission-utils";

const auth = useAuthStore();
const canUpdate = computed(() => auth.permissionsLoaded
  && hasPermissions(auth.permissions, ["order:update"]));
</script>

<template>
  <button v-if="canUpdate">编辑订单</button>
</template>
```

这里的 Store 按项目定义。`usePermission` 也应读取当前响应式 Store；若使用 `v-permission`，要处理权限变化后的更新，不能仅在 `mounted` 时判定一次。按钮隐藏只是交互控制，直接调用编辑 API 仍然必须由后端拒绝。

对象是否可编辑还取决于数据范围和状态。列表可由后端返回每条记录的 `allowedActions` 辅助展示，但这些标识也不是后续写请求的授权凭证。

### 3. 管理权限变化与请求状态

退出、换号、切租户或权限发生变化时：

1. 取消旧请求，或递增身份上下文版本以丢弃过期结果。
2. 清理旧动态路由、菜单、权限、业务查询缓存和敏感数据。
3. 在新的身份/作用域下重新初始化权限并注册路由。
4. 当前页面不再有权访问时，跳转 403 或安全落点。

可通过服务端事件通知、页面重新激活时检查、定期刷新或版本变化更新快照。推送通知只是刷新触发器，不替代服务端授权。多标签页可同步退出和切换事件，但服务端会话仍需独立失效。

### 4. 正确处理 401 与 403

- **401**：未认证或会话失效。仅在约定的可刷新错误下刷新 Token；刷新请求共享一个 Promise，最多有限次重试，失败后清理状态并登录。
- **403**：已经认证但没有权限。展示无权提示，必要时刷新权限快照；不能把它当作 Token 过期无限刷新。
- **404**：对象不存在；为减少资源存在性泄露，后端也可对无权访问的具体对象统一返回 404，规则应保持一致。
- **网络/5xx**：失败提示和重试，不降级开放页面，也不要把所有错误都当成退出登录。

非幂等写操作不能因网络超时而无条件自动重放；需要区分“认证阶段已拒绝、未执行”和“是否已执行未知”，必要时使用幂等键。

## 后端权限防护怎么做

### 1. 统一认证上下文，受保护接口默认拒绝

中间件验证 Session/Token 后，构造可信上下文：用户 ID、当前有效租户/组织、账号状态等。客户端可以请求切换租户，但后端必须验证其成员关系，不能直接信任请求中的 `userId`、`tenantId`、`roles` 或 `permissions`。

每个业务入口显式声明需要的操作权限，例如：

| 接口 | 操作权限 | 额外约束 |
| --- | --- | --- |
| `GET /orders` | `order:read` | 按数据范围查询、字段投影 |
| `GET /orders/:id` | `order:read` | 校验目标对象所属范围 |
| `PATCH /orders/:id` | `order:update` | 对象、写字段、业务状态 |
| `DELETE /orders/:id` | `order:delete` | 对象范围及删除规则 |
| `POST /orders/export` | `order:export` | 导出数据和字段范围 |

- 公开接口明确标记 `public`，其它入口不能因为漏配规则而开放。
- 新接口缺少授权配置时，在启动检查或 CI 中报错；运行时也保持默认拒绝。
- 权限服务不可用或策略读取异常时拒绝受保护操作，不降级放行。
- 网关适合统一认证和粗粒度检查，业务服务负责对象、字段和状态规则。只在 Controller 检查也不够：任务、内部调用等其它入口必须执行同样的业务授权。
- 内部调用须验证调用者身份及被允许的委托范围，不能把任意请求 Header 中的用户 ID 当可信身份。

### 2. 在数据访问层落实范围与对象权限

以“只能修改当前租户内、本人负责且处于草稿状态的订单”为例：

```text
验证会话和账号
  → 验证当前租户成员关系
  → 检查 order:update
  → 只接受允许修改的字段
  → 在对象范围和业务状态条件内更新
  → 根据结果返回并审计
```

参数化 SQL 示例：

```sql
UPDATE orders
SET remark = :remark
WHERE id = :order_id
  AND tenant_id = :trusted_tenant_id
  AND owner_id = :authenticated_user_id
  AND status = 'draft';
```

其中 `trusted_tenant_id` 与 `authenticated_user_id` 来自服务端验证的上下文，`order_id` 是请求指定的目标。执行 SQL 前仍需检查 `order:update`，这条 SQL 只是对象范围和状态限制，不是完整授权。

- 列表、详情、搜索、聚合和分页总数都应应用范围条件；不能后端取全量、前端再过滤。
- 部门/项目授权要使用服务端维护的有效组织或成员关系，不能信任用户提交的部门列表。
- 多租户系统中，关联查询、缓存、文件和任务同样需要租户隔离，不能只给主表加条件。
- 更新结果须按数据库语义处理；零匹配可能表示对象不存在、无权访问或状态不允许，不应返回假成功。
- “先查权限再无条件更新”可能有并发竞态。需要条件写入、事务、行锁或乐观版本校验，按业务选择。

### 3. 读字段和写字段分别控制

- **读**：在服务端进行字段投影或脱敏。普通用户响应里不返回成本价等敏感字段，不能只在前端隐藏列。
- **写**：采用请求字段白名单；未知或禁止字段按约定拒绝，不直接把请求体展开到数据库实体。
- `role`、`tenantId`、`ownerId`、审批状态等敏感属性使用独立操作和授权，不允许通过通用编辑接口顺带修改。
- 是否可以查看某字段与是否可以修改该字段，应分别定义。

### 4. 权限管理接口防止自我提权

权限管理本身是高危业务，至少定义：

- 谁能创建角色、修改角色权限、为目标用户分配或撤销角色。
- 授权者的**可委派权限集合和作用域**；有某项权限不等于可以转授它。
- 目标用户、目标角色必须属于允许管理的租户/组织，不能跨域授权。
- 普通管理员不能通过改自己的角色或调用通用用户编辑接口增加权限。
- 新建角色和修改既有角色，都要校验最终权限集合；不能先创建空角色，再通过编辑接口绕过限制。
- 超级管理员授予、批量授权等高危操作按风险增加重新认证、审批或双人复核，并审计变更前后值。

## 权限生命周期：撤权多久生效

必须明确产品要求：撤权是下一次请求立即生效，还是允许一个有上限的延迟。不能把“Access Token 有效期较短”直接等同于即时撤权。

### JWT 与缓存的常见问题

如果 JWT 携带角色或权限，签名有效只能证明签发时的声明没有被篡改；管理员之后撤权，该声明可能已经过时。

可采用服务端 Session、在线权限查询、服务端权限版本检查、吊销机制或有明确 TTL 的权限缓存。关键点是：**当前有效策略由服务端确定，而不是长期相信 Token 或前端快照。**

设计缓存时应包含：

- 用户、租户/组织作用域及权限版本等必要维度。
- 用户角色变化、角色权限变化、组织关系变化、账号停用时的失效机制；角色变化可能影响多个用户。
- 多实例、网关和任务节点间的失效传播与失败恢复。
- 合理 TTL 作为兜底；权限版本本身若长期缓存，仍然会造成撤权延迟。
- 高风险操作更严格的在线复核，避免仅依赖过期缓存。

写策略与版本变更需要一致性安排，避免“权限已撤销、版本却没更新”。缓存通知可用事务后可靠事件等方式传播，并验证失效失败时的最长延迟。

对于进行中的操作，应定义授权判定时点。要求严格撤权的高风险操作，在提交、任务执行或结果领取阶段复核；长时间执行的任务按政策检查并取消。一次请求开始时有权限，不自动意味着所有后续阶段永远有权限。

## 认证会话及浏览器安全

认证和授权不同，但会话被盗会让攻击者以用户身份行使权限，因此需要配套防护。

| 方案 | 基本要求 |
| --- | --- |
| Cookie Session / BFF | 后端设置 HttpOnly、Secure、适当的 SameSite；限制 Cookie 的 Domain/Path；登录时更新会话 ID；服务端支持过期和吊销 |
| Bearer Access Token + Refresh Token | Access Token 可放内存，Refresh Token 可放受保护的 HttpOnly Cookie；明确 Token 验证、刷新、吊销与并发刷新策略 |

共同要求：

- 全程 HTTPS。账号停用、退出及安全事件能使对应会话失效；仅删除前端 Token 不能使已复制的 Token 失效。
- JWT 验证签名、算法白名单、有效期及预期的 `iss` / `aud` 等，不能仅解码 Payload。Refresh Token 仅用于刷新，不能访问业务 API。
- Refresh Token 轮换时要定义重用检测和会话撤销，同时处理合法并发刷新，避免误判或无限重试。
- 自动携带 Cookie 的状态变更接口需要 CSRF 防护，例如会话绑定的 CSRF Token 和 Origin 校验；GET 不执行状态变更。刷新接口也要考虑 CSRF。
- HttpOnly 降低 JS 直接读取 Cookie 的风险，但不能消除 XSS：恶意脚本仍可能借会话调用接口、读取页面数据。配套输出编码、富文本净化、避免不可信 HTML，以及合适的 CSP。
- LocalStorage 中的 Token 可被同源 JS 读取，不适合长期凭证；内存 Token 同样不能抵御已经执行的恶意脚本，只是减少持久暴露。
- CORS 是浏览器跨源访问规则，**不是身份认证或业务授权**。携带凭据时按白名单允许来源，不反射任意 Origin。
- 采用 OAuth/OIDC 时，使用成熟组件验证授权响应及 ID Token，按流程配置 PKCE、`state` 和适用时的 `nonce`；客户端不能持有 `client_secret`。

更多登录、刷新和 BFF 流程见 [前端常用的鉴权方案](../网络/鉴权方案.md)。

## 不要遗漏导出、批量、任务和文件入口

| 入口 | 必须补充的权限约束 |
| --- | --- |
| 导出/报表 | 独立操作权限；沿用数据和字段范围，不能导出列表中无权查看的内容 |
| 批量操作 | 校验每个对象和每个变更字段；明确全部失败还是逐项结果，不能只检查第一个 ID |
| 后台任务 | 记录请求者及作用域；按政策在创建、执行和领取结果时复核，不能沿用无边界的任务管理员身份 |
| 文件预览/下载 | 校验文件归属、关联业务资源及当前访问权；知道文件 ID 或路径不等于有权访问 |
| 签名下载链接 | 设置短有效期和最小范围；链接通常是持有即访问，泄露后有效期内可能仍能使用，严格撤权需下载代理或可吊销机制 |
| 搜索/统计 | 搜索结果、聚合数量、自动补全和分页总数均受数据范围限制 |
| WebSocket/订阅 | 连接和频道订阅都授权，权限撤销后停止对应消息；只在握手时认证不够 |
| 缓存/BFF/内部 API | 不复用其它用户或租户的敏感结果，不因绕开浏览器或使用内部接口而跳过授权 |

敏感响应和业务缓存按风险配置合适的 `Cache-Control`。共享缓存键和结果范围必须匹配，避免一个用户请求后，另一个用户获得其数据。

## 审计与越权测试

### 审计记录

记录角色和权限变更、用户授权/撤权、高危操作、敏感数据访问及关键拒绝事件，包含：

- 操作者、目标用户或资源、租户/组织作用域。
- 操作、结果、拒绝原因、时间、请求 ID，必要时包含权限版本。
- 授权变更前后值，便于回答“谁在什么时候给谁增加了什么权限”。

不记录密码、完整 Token 或不必要的敏感字段。审计日志自身需要访问控制、防篡改和留存安排，关键日志不能由被审计的普通管理员随意删除。

### 验收清单

验收不能只检查“按钮是否隐藏”，还要直接发送请求验证拒绝结果，并检查没有写入副作用：

- [ ] 未登录、Token 过期、签名错误、发行方或受众不符时，不能访问受保护接口。
- [ ] 低权限用户直接调用删除、审批、角色管理等高权限接口时被拒绝（垂直越权）。
- [ ] 替换 URL、请求体或查询中的资源 ID，不能访问或修改他人对象（水平越权）。
- [ ] 替换租户/部门/项目 ID，不能跨作用域访问；关联查询和缓存也不能泄露。
- [ ] 提交 `role`、`tenantId`、`ownerId` 等隐藏字段，不能通过通用更新接口提权。
- [ ] 列表、详情、导出、搜索、统计的范围和字段规则一致。
- [ ] 批量请求混入一个无权对象，按约定拒绝或逐项处理，没有未授权副作用。
- [ ] 任务创建后撤权、历史导出下载、文件 ID 替换和签名链接有效期符合设计。
- [ ] 撤权或停用后，旧 Token、缓存、其它实例和长连接在规定时间内失效。
- [ ] 零角色/零权限用户初始化不循环，多次导航不重复注册动态路由。
- [ ] 退出、换号、切租户后，旧路由、菜单、业务数据及旧请求结果不残留。
- [ ] 403 不触发无限刷新；权限服务异常和网络错误不导致放行。
- [ ] 新增受保护接口漏配规则时，CI/启动检查发现问题且运行时默认拒绝。
- [ ] 并发修改角色、对象归属或业务状态时，没有绕过授权的竞态。
- [ ] 关键授权变更和拒绝事件产生完整审计，日志不包含敏感凭证。

建议建立“角色 × 操作 × 数据范围”的测试矩阵，使用无角色用户、普通用户、另一用户、另一租户管理员等身份覆盖正向和负向用例，作为接口集成测试持续运行。

## 面试总结

> RBAC 的核心是用户通过角色获得权限。前端根据权限快照控制路由、菜单、按钮和操作入口，负责导航与交互体验；真正的安全边界在后端。后端对每次请求独立验证身份、操作权限、对象/租户/数据范围、字段和业务状态，受保护入口默认拒绝，并覆盖导出、批量、任务和文件等间接入口。权限撤销要处理服务端策略与缓存失效，前端则清理旧路由和状态。最终通过审计及垂直、水平越权测试验收，不能把“Token 有效”或“按钮隐藏”当成完整授权。
