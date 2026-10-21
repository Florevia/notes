<script setup>
import localSearchIndex from "@localSearchIndex";
import { computedAsync, onKeyStroke } from "@vueuse/core";
import MiniSearch from "minisearch";
import { useData, useRouter } from "vitepress";
import {
  computed,
  markRaw,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";

const { localeIndex, theme } = useData();
const router = useRouter();

const root = ref(null);
const inputEl = ref(null);
const expanded = ref(false);
const query = ref("");
const selectedIndex = ref(-1);
const results = shallowRef([]);

const searchIndexData = shallowRef(localSearchIndex);

if (import.meta.hot) {
  import.meta.hot.accept("@localSearchIndex", (m) => {
    if (m) searchIndexData.value = m.default;
  });
}

const buttonText = computed(() => {
  const options = theme.value.search?.options;
  return (
    options?.locales?.[localeIndex.value]?.translations?.button?.buttonText ||
    options?.translations?.button?.buttonText ||
    "搜索"
  );
});

const buttonAriaLabel = computed(() => {
  const options = theme.value.search?.options;
  return (
    options?.locales?.[localeIndex.value]?.translations?.button
      ?.buttonAriaLabel ||
    options?.translations?.button?.buttonAriaLabel ||
    buttonText.value
  );
});

const noResultsText = computed(() => {
  const options = theme.value.search?.options;
  return (
    options?.locales?.[localeIndex.value]?.translations?.modal?.noResultsText ||
    options?.translations?.modal?.noResultsText ||
    "无结果"
  );
});

const searchIndex = computedAsync(async () =>
  markRaw(
    MiniSearch.loadJSON(
      (await searchIndexData.value[localeIndex.value]?.())?.default,
      {
        fields: ["title", "titles", "text"],
        storeFields: ["title", "titles"],
        searchOptions: {
          fuzzy: 0.2,
          prefix: true,
          boost: { title: 4, text: 2, titles: 1 },
          ...(theme.value.search?.provider === "local" &&
            theme.value.search.options?.miniSearch?.searchOptions),
        },
        ...(theme.value.search?.provider === "local" &&
          theme.value.search.options?.miniSearch?.options),
      },
    ),
  ),
);

function isEditingContent(event) {
  const element = event.target;
  const tagName = element?.tagName;
  return (
    element?.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "SELECT" ||
    tagName === "TEXTAREA"
  );
}

async function open() {
  if (expanded.value) {
    inputEl.value?.focus();
    return;
  }
  expanded.value = true;
  await nextTick();
  // Let width grow a beat, then focus
  requestAnimationFrame(() => {
    inputEl.value?.focus();
  });
}

function close() {
  expanded.value = false;
  selectedIndex.value = -1;
  inputEl.value?.blur();
}

function clearQuery() {
  query.value = "";
  selectedIndex.value = -1;
  nextTick(() => inputEl.value?.focus());
}

function onBarPointerDown(event) {
  if (expanded.value) return;
  // Keep focus from jumping before expand animation starts
  if (event.target === inputEl.value) return;
  event.preventDefault();
  open();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function highlight(text, terms) {
  const raw = escapeHtml(text || "");
  if (!terms.length) return raw;
  const pattern = terms
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!pattern) return raw;
  return raw.replace(new RegExp(`(${pattern})`, "gi"), "<mark>$1</mark>");
}

watch([searchIndex, query], ([index, q]) => {
  const text = (q || "").trim();
  if (!index || !text) {
    results.value = [];
    selectedIndex.value = -1;
    return;
  }

  const hits = index.search(text).slice(0, 12);
  const terms = [
    ...new Set(hits.flatMap((hit) => Object.keys(hit.match || {}))),
  ];

  results.value = hits.map((hit) => ({
    id: hit.id,
    titleHtml: highlight(hit.title, terms),
    titlesHtml: (hit.titles || []).map((t) => highlight(t, terms)),
    label: [...(hit.titles || []), hit.title].join(" > "),
  }));
  selectedIndex.value = results.value.length ? 0 : -1;
});

function go(id) {
  if (!id) return;
  router.go(id);
  close();
  query.value = "";
}

onKeyStroke("k", (event) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    open();
  }
});

onKeyStroke("/", (event) => {
  if (!isEditingContent(event)) {
    event.preventDefault();
    open();
  }
});

onKeyStroke("Escape", () => {
  if (expanded.value) close();
});

onKeyStroke("ArrowDown", (event) => {
  if (!expanded.value || !results.value.length) return;
  event.preventDefault();
  selectedIndex.value = (selectedIndex.value + 1) % results.value.length;
});

onKeyStroke("ArrowUp", (event) => {
  if (!expanded.value || !results.value.length) return;
  event.preventDefault();
  selectedIndex.value =
    (selectedIndex.value - 1 + results.value.length) % results.value.length;
});

onKeyStroke("Enter", (event) => {
  if (!expanded.value || event.isComposing) return;
  const hit = results.value[selectedIndex.value];
  if (hit) {
    event.preventDefault();
    go(hit.id);
  }
});

function onGlobalPointerDown(event) {
  if (!expanded.value) return;
  if (root.value && !root.value.contains(event.target)) close();
}

onMounted(() => {
  window.addEventListener("pointerdown", onGlobalPointerDown, true);
});

onUnmounted(() => {
  window.removeEventListener("pointerdown", onGlobalPointerDown, true);
});
</script>

<template>
  <div ref="root" class="VPNavBarSearch" :class="{ 'is-expanded': expanded }">
    <div class="inline-search">
      <form
        class="inline-search__bar"
        role="search"
        @submit.prevent
        @pointerdown="onBarPointerDown"
      >
        <span class="vpi-search inline-search__icon" aria-hidden="true" />

        <input
          ref="inputEl"
          v-model="query"
          class="inline-search__input"
          type="search"
          maxlength="64"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          :placeholder="buttonText"
          :aria-label="buttonAriaLabel"
          :tabindex="expanded ? 0 : -1"
          :readonly="!expanded"
          @focus="open"
        />

        <span class="inline-search__keys" aria-hidden="true" />

        <button
          v-if="query"
          type="button"
          class="inline-search__action"
          title="清空"
          tabindex="-1"
          @click="clearQuery"
        >
          <span class="vpi-delete" />
        </button>

        <button
          type="button"
          class="inline-search__action inline-search__close"
          title="关闭"
          tabindex="-1"
          :aria-hidden="expanded ? undefined : 'true'"
          @click="close"
        >
          esc
        </button>
      </form>

      <ul
        v-if="expanded && query.trim()"
        class="inline-search__results"
        role="listbox"
      >
        <li
          v-for="(item, index) in results"
          :key="item.id"
          role="option"
          :aria-selected="selectedIndex === index"
        >
          <a
            :href="item.id"
            class="inline-search__result"
            :class="{ selected: selectedIndex === index }"
            :aria-label="item.label"
            @mouseenter="selectedIndex = index"
            @click.prevent="go(item.id)"
          >
            <span class="inline-search__hash">#</span>
            <span class="inline-search__titles">
              <span
                v-for="(t, i) in item.titlesHtml"
                :key="i"
                class="inline-search__crumb"
              >
                <span v-html="t" />
                <span class="vpi-chevron-right" />
              </span>
              <span class="inline-search__title" v-html="item.titleHtml" />
            </span>
          </a>
        </li>
        <li v-if="!results.length" class="inline-search__empty">
          {{ noResultsText }} “<strong>{{ query.trim() }}</strong>”
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
.VPNavBarSearch {
  --search-collapsed-w: 40px;
  --search-expanded-w: min(100%, 420px);
  display: flex;
  align-items: center;
  position: relative;
  justify-content: flex-start;
}

@media (min-width: 768px) {
  .VPNavBarSearch {
    --search-collapsed-w: 220px;
    flex-grow: 1;
    padding-left: 24px;
  }
}

@media (min-width: 960px) {
  .VPNavBarSearch {
    padding-left: 32px;
  }
}

.inline-search {
  position: relative;
  width: var(--search-collapsed-w);
  max-width: 100%;
  transform-origin: left center;
  transition: width 320ms var(--vp-search-ease, cubic-bezier(0.25, 1, 0.5, 1));
  will-change: width;
}

.VPNavBarSearch.is-expanded .inline-search {
  width: var(--search-expanded-w);
}

.inline-search__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--vp-local-search-bg, var(--vp-c-bg-alt));
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 180ms var(--vp-search-ease, ease),
    box-shadow 180ms var(--vp-search-ease, ease),
    background-color 180ms var(--vp-search-ease, ease);
}

.VPNavBarSearch:not(.is-expanded) .inline-search__bar:hover {
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
  color: var(--vp-c-brand-1);
}

.VPNavBarSearch.is-expanded .inline-search__bar {
  cursor: text;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.inline-search__icon {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  color: var(--vp-c-text-3);
  font-size: 15px;
  transition: color 180ms var(--vp-search-ease, ease);
}

.VPNavBarSearch:not(.is-expanded) .inline-search__bar:hover .inline-search__icon,
.VPNavBarSearch.is-expanded .inline-search__icon {
  color: var(--vp-c-brand-1);
}

.inline-search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 500;
  caret-color: var(--vp-c-brand-1);
  cursor: inherit;
}

.VPNavBarSearch:not(.is-expanded) .inline-search__input {
  color: var(--vp-c-text-2);
  pointer-events: none;
}

.VPNavBarSearch:not(.is-expanded) .inline-search__bar:hover .inline-search__input {
  color: var(--vp-c-brand-1);
}

.inline-search__input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

.inline-search__input::placeholder {
  color: inherit;
  opacity: 0.85;
}

.inline-search__keys {
  flex-shrink: 0;
  margin-left: auto;
  padding: 4px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  opacity: 1;
  max-width: 72px;
  overflow: hidden;
  transition:
    opacity 180ms var(--vp-search-ease, ease),
    max-width 280ms var(--vp-search-ease, ease),
    margin 280ms var(--vp-search-ease, ease),
    padding 280ms var(--vp-search-ease, ease),
    border-color 180ms var(--vp-search-ease, ease);
}

.inline-search__keys::after {
  direction: ltr;
  content: "Ctrl K";
}

.mac .inline-search__keys::after {
  content: "\2318  K";
}

.VPNavBarSearch:not(.is-expanded) .inline-search__bar:hover .inline-search__keys {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, transparent);
  color: var(--vp-c-brand-1);
}

.VPNavBarSearch.is-expanded .inline-search__keys {
  opacity: 0;
  max-width: 0;
  margin: 0;
  padding-left: 0;
  padding-right: 0;
  border-color: transparent;
  pointer-events: none;
}

.inline-search__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 26px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  max-width: 0;
  padding-left: 0;
  padding-right: 0;
  overflow: hidden;
  pointer-events: none;
  transition:
    opacity 180ms var(--vp-search-ease, ease) 80ms,
    max-width 280ms var(--vp-search-ease, ease),
    padding 280ms var(--vp-search-ease, ease),
    color 160ms ease,
    background-color 160ms ease;
}

.VPNavBarSearch.is-expanded .inline-search__action {
  opacity: 1;
  max-width: 64px;
  padding: 0 8px;
  pointer-events: auto;
}

.inline-search__action:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-default-soft, rgba(142, 150, 170, 0.14));
}

.inline-search__results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: min(60vh, 420px);
  margin: 0;
  padding: 10px;
  list-style: none;
  overflow: auto;
  border: 1px solid color-mix(in srgb, #fff 8%, transparent);
  border-radius: 18px;
  background: var(--vp-local-search-bg, var(--vp-c-bg-alt));
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.22),
    0 0 0 1px color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
  transform-origin: top left;
  animation: inline-search-results-in 220ms
    var(--vp-search-ease, cubic-bezier(0.25, 1, 0.5, 1)) both;
}

@keyframes inline-search-results-in {
  from {
    opacity: 0;
    transform: translateY(-4px) scaleY(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}

.inline-search__result {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.inline-search__result:hover,
.inline-search__result.selected {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
  background: var(--vp-c-brand-soft);
}

.inline-search__hash {
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.inline-search__titles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 4px;
  min-width: 0;
  white-space: normal;
  line-height: 1.4;
  font-size: 13px;
}

.inline-search__crumb {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--vp-c-text-3);
}

.inline-search__title {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.inline-search__titles mark {
  border-radius: 4px;
  padding: 0 2px;
  background: var(--vp-c-brand-1);
  color: var(--vp-local-search-highlight-text, #1a1a1a);
}

.inline-search__empty {
  padding: 16px 12px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  white-space: normal;
}

.inline-search__empty strong {
  color: var(--vp-c-brand-1);
}

@media (max-width: 767px) {
  .VPNavBarSearch {
    --search-collapsed-w: 40px;
  }

  .VPNavBarSearch.is-expanded {
    --search-expanded-w: min(72vw, 280px);
  }

  .inline-search__keys,
  .inline-search__input::placeholder {
    /* icon-only collapsed chip on small screens */
  }

  .VPNavBarSearch:not(.is-expanded) .inline-search__input,
  .VPNavBarSearch:not(.is-expanded) .inline-search__keys {
    opacity: 0;
    max-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    pointer-events: none;
  }

  .VPNavBarSearch:not(.is-expanded) .inline-search__bar {
    justify-content: center;
    padding: 0;
  }

  .inline-search__close {
    font-size: 0;
  }

  .VPNavBarSearch.is-expanded .inline-search__close {
    font-size: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .inline-search,
  .inline-search__bar,
  .inline-search__keys,
  .inline-search__action,
  .inline-search__results {
    transition: none !important;
    animation: none !important;
  }
}
</style>
