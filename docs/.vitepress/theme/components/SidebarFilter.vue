<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vitepress";
import {
  applySidebarFilter,
  resetSidebarFilter,
} from "../utils/sidebarFilter.js";

const route = useRoute();
const query = ref("");
const matchCount = ref(null);
const rootRef = ref(null);
const focused = ref(false);

let debounceTimer = null;
const DEBOUNCE_MS = 90;

function getSidebarRoot() {
  const el = rootRef.value;
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

function scheduleFilter() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runFilter();
  }, DEBOUNCE_MS);
}

function clearQuery() {
  query.value = "";
  clearTimeout(debounceTimer);
  nextTick(() => runFilter());
}

watch(query, () => {
  scheduleFilter();
});

watch(
  () => route.path,
  async () => {
    clearTimeout(debounceTimer);
    query.value = "";
    matchCount.value = null;
    await nextTick();
    const root = getSidebarRoot();
    if (root) resetSidebarFilter(root);
  }
);

onMounted(async () => {
  await nextTick();
  const root = getSidebarRoot();
  // Enable transitions after first paint to avoid mount flicker.
  if (root?.dataset) root.dataset.sidebarFilterReady = "true";
});

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
  const root = getSidebarRoot();
  if (root) {
    resetSidebarFilter(root);
    if (root.dataset) delete root.dataset.sidebarFilterReady;
  }
});
</script>

<template>
  <div
    class="sidebar-filter"
    :class="{ 'is-focused': focused, 'has-query': !!query.trim() }"
    ref="rootRef"
  >
    <div class="sidebar-filter__field">
      <span class="sidebar-filter__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M16.2 16.2L20 20"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <input
        v-model="query"
        class="sidebar-filter__input"
        type="search"
        placeholder="筛选侧边栏…"
        aria-label="筛选侧边栏"
        autocomplete="off"
        spellcheck="false"
        @focus="focused = true"
        @blur="focused = false"
      />
      <button
        v-if="query"
        type="button"
        class="sidebar-filter__clear"
        aria-label="清除筛选"
        @mousedown.prevent
        @click="clearQuery"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <Transition name="sidebar-filter-meta">
      <p
        v-if="query.trim() && matchCount === 0"
        class="sidebar-filter__empty"
        key="empty"
      >
        无匹配项
      </p>
      <p
        v-else-if="query.trim() && matchCount != null && matchCount > 0"
        class="sidebar-filter__count"
        key="count"
      >
        {{ matchCount }} 项匹配
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.sidebar-filter {
  --sf-ease: cubic-bezier(0.25, 1, 0.5, 1);
  padding: 0 0 12px;
}

.sidebar-filter__field {
  position: relative;
  display: flex;
  align-items: center;
}

.sidebar-filter__icon {
  position: absolute;
  left: 10px;
  display: flex;
  color: var(--vp-c-text-3);
  pointer-events: none;
  transition: color 180ms var(--sf-ease), transform 180ms var(--sf-ease);
}

.sidebar-filter.is-focused .sidebar-filter__icon {
  color: var(--vp-c-brand-1);
  transform: scale(1.05);
}

.sidebar-filter__input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 30px 7px 30px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.4;
  outline: none;
  transition:
    border-color 180ms var(--sf-ease),
    box-shadow 180ms var(--sf-ease),
    background-color 180ms var(--sf-ease);
}

.sidebar-filter__input::placeholder {
  color: var(--vp-c-text-3);
  transition: opacity 160ms var(--sf-ease);
}

.sidebar-filter.is-focused .sidebar-filter__input {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.sidebar-filter__input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.sidebar-filter__clear {
  position: absolute;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition:
    color 160ms var(--sf-ease),
    background-color 160ms var(--sf-ease),
    transform 120ms var(--sf-ease);
}

.sidebar-filter__clear:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft, rgba(142, 150, 170, 0.14));
}

.sidebar-filter__clear:active {
  transform: scale(0.92);
}

.sidebar-filter__empty,
.sidebar-filter__count {
  margin: 8px 2px 0;
  font-size: 12px;
  line-height: 1.3;
}

.sidebar-filter__empty {
  color: var(--vp-c-text-2);
}

.sidebar-filter__count {
  color: var(--vp-c-brand-1);
}

.sidebar-filter-meta-enter-active,
.sidebar-filter-meta-leave-active {
  transition:
    opacity 180ms var(--sf-ease),
    transform 180ms var(--sf-ease);
}

.sidebar-filter-meta-enter-from,
.sidebar-filter-meta-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-filter__icon,
  .sidebar-filter__input,
  .sidebar-filter__clear,
  .sidebar-filter-meta-enter-active,
  .sidebar-filter-meta-leave-active {
    transition: none !important;
  }
}
</style>
