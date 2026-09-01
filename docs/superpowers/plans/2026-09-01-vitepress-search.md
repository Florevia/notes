# VitePress Search + Sidebar Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add VitePress local full-text search and a sidebar title filter input so users can find notes quickly.

**Architecture:** Enable `themeConfig.search.provider: 'local'` for Cmd/Ctrl+K full-site search. Add a `SidebarFilter` Vue component in the `sidebar-nav-before` slot that applies DOM visibility rules to `.VPSidebarItem` nodes via a small pure helper (testable with Node's built-in test runner).

**Tech Stack:** VitePress `2.0.0-alpha.15`, Vue 3 SFC theme override, Node `node:test` for the pure filter helper.

**Spec:** `docs/superpowers/specs/2026-09-01-vitepress-search-design.md`

## Global Constraints

- Search provider must be VitePress built-in `local` only (no Algolia)
- Sidebar filter matches titles only (substring, case-insensitive); never body text
- Filter query is component-local state; clear on route change; no `localStorage` / URL sync
- Placeholder text exactly: `筛选侧边栏…`
- Empty-state text exactly: `无匹配项`
- Local search UI copy in Chinese per spec
- Do not modify markdown note content or `sidebar` tree data in `config.mts` beyond adding `search`
- Style with VitePress CSS variables; no extra animation libraries

## File Structure

| File | Responsibility |
|------|----------------|
| `docs/.vitepress/config.mts` | Enable local search + Chinese translations |
| `docs/.vitepress/theme/utils/sidebarFilter.js` | Pure match + DOM apply/reset helpers |
| `docs/.vitepress/theme/utils/sidebarFilter.test.js` | Node tests for match/apply rules |
| `docs/.vitepress/theme/components/SidebarFilter.vue` | Input UI, wiring, empty state |
| `docs/.vitepress/theme/Layout.vue` | Mount filter into `sidebar-nav-before` |

---

### Task 1: Enable VitePress local search

**Files:**
- Modify: `docs/.vitepress/config.mts` (inside `themeConfig`, after `outline`)
- Test: manual via `pnpm ll:dev`

**Interfaces:**
- Consumes: existing `defineConfig` / `themeConfig`
- Produces: nav search button + `Cmd/Ctrl+K` modal powered by local index

- [ ] **Step 1: Add `search` config to `themeConfig`**

In `docs/.vitepress/config.mts`, inside `themeConfig`, immediately after the `outline` block, insert:

```ts
search: {
  provider: "local",
  options: {
    translations: {
      button: {
        buttonText: "搜索",
        buttonAriaLabel: "搜索文档",
      },
      modal: {
        displayDetails: "显示详细列表",
        resetButtonTitle: "重置搜索",
        backButtonTitle: "关闭搜索",
        noResultsText: "无结果",
        footer: {
          selectText: "选择",
          navigateText: "切换",
          closeText: "关闭",
        },
      },
    },
  },
},
```

Do not change `nav`, `sidebar`, or other theme options in this task.

- [ ] **Step 2: Start the site and verify search UI**

Run:

```bash
pnpm ll:dev
```

Expected: VitePress starts without config errors. Open the printed local URL.

Manual checks:

1. Nav bar shows a search control labeled 「搜索」
2. `Cmd+K` (macOS) or `Ctrl+K` opens the search modal
3. Typing a known note title (e.g. a string from an interview note) returns hits
4. Clicking a hit navigates to that page
5. A nonsense query shows 「无结果」

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/config.mts
git commit -m "$(cat <<'EOF'
feat: enable VitePress local search with Chinese UI

EOF
)"
```

---

### Task 2: Sidebar filter helper (pure logic + tests)

**Files:**
- Create: `docs/.vitepress/theme/utils/sidebarFilter.js`
- Create: `docs/.vitepress/theme/utils/sidebarFilter.test.js`
- Test: `node --test docs/.vitepress/theme/utils/sidebarFilter.test.js`

**Interfaces:**
- Consumes: none
- Produces:
  - `normalizeQuery(query: string): string` — trim + lowercase
  - `textMatches(text: string, normalizedQuery: string): boolean` — substring match; empty query matches all
  - `applySidebarFilter(root: ParentNode, query: string): { matchCount: number }` — hide/show `.VPSidebarItem` under `root`
  - `resetSidebarFilter(root: ParentNode): void` — clear filter styles/classes applied by `applySidebarFilter`
  - Hide attribute used on items: `data-sidebar-filter-hidden="true"` plus inline `display: none` (or equivalent) so items are not visible
  - When a child matches, ancestors stay visible and have `collapsed` class removed if present
  - When a group title matches, all descendant `.VPSidebarItem` stay visible

- [ ] **Step 1: Write the failing tests**

Create `docs/.vitepress/theme/utils/sidebarFilter.test.js`:

```js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  normalizeQuery,
  textMatches,
  applySidebarFilter,
  resetSidebarFilter,
} from "./sidebarFilter.js";

describe("normalizeQuery", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeQuery("  Hello "), "hello");
  });
});

describe("textMatches", () => {
  it("matches substring case-insensitively", () => {
    assert.equal(textMatches("Promise 原理", "promise"), true);
    assert.equal(textMatches("Promise 原理", "原理"), true);
    assert.equal(textMatches("Promise 原理", "vue"), false);
  });

  it("empty query matches everything", () => {
    assert.equal(textMatches("任意标题", ""), true);
  });
});

function makeSidebarDom() {
  const dom = new JSDOM(`<!DOCTYPE html><body>
    <nav class="nav">
      <section class="VPSidebarItem level-0 collapsed">
        <div class="item"><p class="text">面试</p></div>
        <div class="items">
          <div class="VPSidebarItem level-1">
            <div class="item"><p class="text">闭包</p></div>
          </div>
          <div class="VPSidebarItem level-1">
            <div class="item"><p class="text">原型链</p></div>
          </div>
        </div>
      </section>
      <section class="VPSidebarItem level-0">
        <div class="item"><p class="text">网络</p></div>
        <div class="items">
          <div class="VPSidebarItem level-1">
            <div class="item"><p class="text">HTTP</p></div>
          </div>
        </div>
      </section>
    </nav>
  </body>`);
  return dom.window.document.querySelector(".nav");
}

describe("applySidebarFilter", () => {
  it("keeps ancestors when a child matches and expands collapsed parent", () => {
    const root = makeSidebarDom();
    const result = applySidebarFilter(root, "闭包");
    assert.equal(result.matchCount, 1);

    const interview = root.querySelectorAll(".VPSidebarItem.level-0")[0];
    const network = root.querySelectorAll(".VPSidebarItem.level-0")[1];
    const closure = interview.querySelectorAll(".VPSidebarItem.level-1")[0];
    const proto = interview.querySelectorAll(".VPSidebarItem.level-1")[1];

    assert.equal(interview.dataset.sidebarFilterHidden, undefined);
    assert.equal(interview.classList.contains("collapsed"), false);
    assert.equal(closure.dataset.sidebarFilterHidden, undefined);
    assert.equal(proto.dataset.sidebarFilterHidden, "true");
    assert.equal(network.dataset.sidebarFilterHidden, "true");
  });

  it("when group title matches, keeps the whole group visible", () => {
    const root = makeSidebarDom();
    const result = applySidebarFilter(root, "网络");
    assert.ok(result.matchCount >= 1);

    const network = root.querySelectorAll(".VPSidebarItem.level-0")[1];
    const http = network.querySelector(".VPSidebarItem.level-1");
    assert.equal(network.dataset.sidebarFilterHidden, undefined);
    assert.equal(http.dataset.sidebarFilterHidden, undefined);

    const interview = root.querySelectorAll(".VPSidebarItem.level-0")[0];
    assert.equal(interview.dataset.sidebarFilterHidden, "true");
  });

  it("returns matchCount 0 when nothing matches", () => {
    const root = makeSidebarDom();
    const result = applySidebarFilter(root, "zzz-no-hit");
    assert.equal(result.matchCount, 0);
    for (const el of root.querySelectorAll(".VPSidebarItem")) {
      assert.equal(el.dataset.sidebarFilterHidden, "true");
    }
  });
});

describe("resetSidebarFilter", () => {
  it("clears hidden marks", () => {
    const root = makeSidebarDom();
    applySidebarFilter(root, "闭包");
    resetSidebarFilter(root);
    for (const el of root.querySelectorAll(".VPSidebarItem")) {
      assert.equal(el.dataset.sidebarFilterHidden, undefined);
      assert.notEqual(el.style.display, "none");
    }
  });
});
```

Note: this test file imports `jsdom`. If `jsdom` is not already a dependency, install it as a **devDependency** in the repo root:

```bash
pnpm add -D jsdom
```

- [ ] **Step 2: Run tests and confirm they fail**

Run:

```bash
node --test docs/.vitepress/theme/utils/sidebarFilter.test.js
```

Expected: FAIL (module `./sidebarFilter.js` missing, or exports missing).

- [ ] **Step 3: Implement `sidebarFilter.js`**

Create `docs/.vitepress/theme/utils/sidebarFilter.js`:

```js
export function normalizeQuery(query) {
  return String(query ?? "").trim().toLowerCase();
}

export function textMatches(text, normalizedQuery) {
  if (!normalizedQuery) return true;
  return String(text ?? "").toLowerCase().includes(normalizedQuery);
}

function getItemText(el) {
  const textEl = el.querySelector(":scope > .item .text");
  return textEl ? textEl.textContent || "" : "";
}

function setHidden(el, hidden) {
  if (hidden) {
    el.dataset.sidebarFilterHidden = "true";
    el.style.display = "none";
  } else {
    delete el.dataset.sidebarFilterHidden;
    el.style.removeProperty("display");
  }
}

/**
 * @param {ParentNode} root
 * @param {string} query
 * @returns {{ matchCount: number }}
 */
export function applySidebarFilter(root, query) {
  const q = normalizeQuery(query);
  const items = [...root.querySelectorAll(".VPSidebarItem")];

  if (!q) {
    resetSidebarFilter(root);
    return { matchCount: items.length };
  }

  const selfMatch = new Map();
  for (const el of items) {
    selfMatch.set(el, textMatches(getItemText(el), q));
  }

  const keep = new Set();
  let matchCount = 0;

  for (const el of items) {
    if (!selfMatch.get(el)) continue;
    matchCount += 1;
    keep.add(el);
    // ancestors
    let parent = el.parentElement;
    while (parent && parent !== root) {
      if (parent.classList?.contains("VPSidebarItem")) {
        keep.add(parent);
        parent.classList.remove("collapsed");
      }
      parent = parent.parentElement;
    }
    // if group title matched, keep all descendants
    for (const child of el.querySelectorAll(".VPSidebarItem")) {
      keep.add(child);
    }
  }

  for (const el of items) {
    setHidden(el, !keep.has(el));
  }

  return { matchCount };
}

/**
 * @param {ParentNode} root
 */
export function resetSidebarFilter(root) {
  for (const el of root.querySelectorAll(".VPSidebarItem")) {
    delete el.dataset.sidebarFilterHidden;
    el.style.removeProperty("display");
  }
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
node --test docs/.vitepress/theme/utils/sidebarFilter.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/theme/utils/sidebarFilter.js docs/.vitepress/theme/utils/sidebarFilter.test.js package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: add sidebar title filter helper with tests

EOF
)"
```

Only stage `package.json` / `pnpm-lock.yaml` if `jsdom` was added in this task.

---

### Task 3: SidebarFilter component + Layout wiring

**Files:**
- Create: `docs/.vitepress/theme/components/SidebarFilter.vue`
- Modify: `docs/.vitepress/theme/Layout.vue`
- Test: manual via `pnpm ll:dev`

**Interfaces:**
- Consumes: `applySidebarFilter`, `resetSidebarFilter` from `../utils/sidebarFilter.js`
- Consumes: VitePress slot `sidebar-nav-before`; sidebar DOM `.VPSidebarItem`
- Produces: filter input in sidebar; empty-state line when `matchCount === 0` and query non-empty

- [ ] **Step 1: Create `SidebarFilter.vue`**

Create `docs/.vitepress/theme/components/SidebarFilter.vue` with this content:

```vue
<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { useRoute } from "vitepress";
import {
  applySidebarFilter,
  resetSidebarFilter,
} from "../utils/sidebarFilter.js";

const route = useRoute();
const query = ref("");
const matchCount = ref(null);
const inputRef = ref(null);

function getSidebarRoot() {
  // Filter sits in sidebar-nav-before; climb to the sidebar nav container.
  const el = inputRef.value;
  if (!el) return null;
  return el.closest(".VPSidebar") || el.closest("nav") || el.parentElement;
}

function runFilter() {
  const root = getSidebarRoot();
  if (!root) return;

  const q = query.value.trim();
  if (!q) {
    resetSidebarFilter(root);
    matchCount.value = null;
    return;
  }

  const result = applySidebarFilter(root, q);
  matchCount.value = result.matchCount;
}

watch(query, async () => {
  await nextTick();
  runFilter();
});

watch(
  () => route.path,
  async () => {
    query.value = "";
    matchCount.value = null;
    await nextTick();
    const root = getSidebarRoot();
    if (root) resetSidebarFilter(root);
  }
);

onBeforeUnmount(() => {
  const root = getSidebarRoot();
  if (root) resetSidebarFilter(root);
});
</script>

<template>
  <div class="sidebar-filter" ref="inputRef">
    <input
      v-model="query"
      class="sidebar-filter__input"
      type="search"
      placeholder="筛选侧边栏…"
      aria-label="筛选侧边栏"
      autocomplete="off"
      spellcheck="false"
    />
    <p
      v-if="query.trim() && matchCount === 0"
      class="sidebar-filter__empty"
    >
      无匹配项
    </p>
  </div>
</template>

<style scoped>
.sidebar-filter {
  padding: 0 0 12px;
}

.sidebar-filter__input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
}

.sidebar-filter__input:focus {
  border-color: var(--vp-c-brand-1);
}

.sidebar-filter__empty {
  margin: 8px 2px 0;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
</style>
```

- [ ] **Step 2: Wire into `Layout.vue`**

Replace `docs/.vitepress/theme/Layout.vue` with:

```vue
<script setup>
import DefaultTheme from "vitepress/theme";
import BackgroundEffects from "./components/BackgroundEffects.vue";
import Fireworks from "./components/Fireworks.vue";
import SidebarFilter from "./components/SidebarFilter.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #sidebar-nav-before>
      <SidebarFilter />
    </template>
    <template #layout-bottom>
      <BackgroundEffects />
      <Fireworks />
    </template>
  </Layout>
</template>
```

Keep existing `#layout-bottom` behavior unchanged aside from adding the new slot.

- [ ] **Step 3: Manual verification**

Run:

```bash
pnpm ll:dev
```

Open a page with a long sidebar (e.g. `/interview/html/浏览器渲染模式.md`).

Checks from the spec:

1. Sidebar top shows input with placeholder `筛选侧边栏…`
2. Type a known title fragment → only matching items (and ancestors) remain; collapsed parents with hits expand
3. Type a group title → whole group remains visible
4. Type nonsense → shows `无匹配项`
5. Clear input → full sidebar restored
6. Navigate to another sidebar page → filter input is empty and sidebar is unfiltered
7. Toggle dark mode → input remains readable
8. Home page (no sidebar) → no broken UI / no console errors from the filter

Also re-check Task 1 search still works.

- [ ] **Step 4: Re-run unit tests**

```bash
node --test docs/.vitepress/theme/utils/sidebarFilter.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/theme/components/SidebarFilter.vue docs/.vitepress/theme/Layout.vue
git commit -m "$(cat <<'EOF'
feat: add sidebar title filter to VitePress theme

EOF
)"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| Local full-site search + Cmd/Ctrl+K | Task 1 |
| Chinese search UI copy | Task 1 |
| Sidebar filter at top of every sidebar page | Task 3 (`sidebar-nav-before`) |
| Placeholder `筛选侧边栏…` | Task 3 |
| Substring / case-insensitive title match | Task 2 |
| Child hit keeps ancestors + expands | Task 2 |
| Parent title hit keeps whole group | Task 2 |
| Empty query restores all | Task 2 + Task 3 |
| Empty state `无匹配项` | Task 3 |
| No persistence across routes | Task 3 route watcher |
| Theme-aligned styles / dark mode | Task 3 CSS variables |
| No Algolia / no search page / no markdown edits | All tasks |

## Self-Review Notes

- No TBD/placeholder steps
- Helper export names are consistent across Task 2 tests, implementation, and Task 3 imports
- `jsdom` is only for Node tests; runtime filter uses browser DOM in the VitePress theme
