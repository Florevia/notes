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
