<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vitepress";
import DefaultTheme, { useLayout } from "vitepress/theme";
import BackgroundEffects from "./components/BackgroundEffects.vue";
import Fireworks from "./components/Fireworks.vue";
import HomeTopics from "./components/HomeTopics.vue";

const { Layout } = DefaultTheme;
const route = useRoute();
const { hasSidebar } = useLayout();
const sidebarCollapsed = ref(false);
const sidebarStorageKey = "notes:sidebar-collapsed";
const motionTargets = [
  ".VPNavBarTitle",
  ".VPNavBar .content-body > *",
  ".VPLocalNav > .container > *",
  ".VPDoc .content-container",
  ".VPDoc .aside-container",
  ".VPDoc .aside-curtain",
  ".VPPage",
].join(", ");
const layoutAnimations = new Map();
let motionVersion = 0;
let sidebarFrame;
let sidebarTimer;
let reducedMotion;

function cancelLayoutMotion() {
  motionVersion += 1;
  for (const [element, animation] of layoutAnimations) {
    animation.cancel();
    element.style.removeProperty("will-change");
  }
  layoutAnimations.clear();
}

function cancelSidebarScroll() {
  cancelAnimationFrame(sidebarFrame);
  clearTimeout(sidebarTimer);
}

onMounted(() => {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion.addEventListener("change", cancelLayoutMotion);
  window.addEventListener("resize", cancelLayoutMotion, { passive: true });
  try {
    sidebarCollapsed.value = localStorage.getItem(sidebarStorageKey) === "true";
  } catch {
    // The toggle still works when browser storage is unavailable.
  }
});

onBeforeUnmount(() => {
  cancelLayoutMotion();
  cancelSidebarScroll();
  reducedMotion?.removeEventListener("change", cancelLayoutMotion);
  window.removeEventListener("resize", cancelLayoutMotion);
});

async function toggleSidebar() {
  cancelSidebarScroll();
  const desktop = window.matchMedia("(min-width: 960px)").matches;
  const animate = desktop && !reducedMotion?.matches;

  // Position the active item while hidden, not during the entrance animation.
  if (desktop && sidebarCollapsed.value) {
    scrollSidebarToActive({ instant: true, allowHidden: true });
  }

  // Read current visual positions before cancelling interrupted animations.
  const elements = animate ? [...document.querySelectorAll(motionTargets)] : [];
  const before = elements.map((element) => ({
    element,
    rect: element.getBoundingClientRect(),
  }));
  cancelLayoutMotion();
  const version = motionVersion;
  sidebarCollapsed.value = !sidebarCollapsed.value;
  try {
    localStorage.setItem(sidebarStorageKey, String(sidebarCollapsed.value));
  } catch {
    // Persistence is optional; keep the in-memory state.
  }

  await nextTick();
  if (!animate || version !== motionVersion) return;

  // Batch final-layout reads, then animate only translations (no text scaling).
  const changes = before.map(({ element, rect }) => {
    const next = element.getBoundingClientRect();
    return { element, dx: rect.left - next.left, dy: rect.top - next.top };
  });
  for (const { element, dx, dy } of changes) {
    if (!element.isConnected || !element.animate || Math.abs(dx) + Math.abs(dy) < 0.5) continue;
    element.style.willChange = "transform";
    const animation = element.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: 280, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
    );
    layoutAnimations.set(element, animation);
    const release = () => {
      if (layoutAnimations.get(element) !== animation) return;
      layoutAnimations.delete(element);
      element.style.removeProperty("will-change");
    };
    animation.onfinish = release;
    animation.oncancel = release;
  }
}

function scrollSidebarToActive({ instant = false, allowHidden = false } = {}) {
  const sidebar = document.querySelector(".VPSidebar");
  if (!sidebar) return;
  if (!allowHidden && (
    getComputedStyle(sidebar).visibility === "hidden" ||
    (sidebarCollapsed.value && window.matchMedia("(min-width: 960px)").matches)
  )) return;

  const active =
    sidebar.querySelector(".VPSidebarItem.is-active") ||
    sidebar.querySelector(".VPSidebarItem.has-active");
  if (!active) return;

  const target = active.querySelector(":scope > .item") || active;
  const targetRect = target.getBoundingClientRect();
  const sidebarRect = sidebar.getBoundingClientRect();
  sidebar.scrollTo({
    top: sidebar.scrollTop + targetRect.top - sidebarRect.top -
      (sidebar.clientHeight - targetRect.height) / 2,
    behavior: instant || reducedMotion?.matches ? "instant" : "smooth",
  });
}

watch(
  () => route.path,
  async () => {
    cancelLayoutMotion();
    cancelSidebarScroll();
    await nextTick();
    sidebarFrame = requestAnimationFrame(() => {
      scrollSidebarToActive();
      // Sidebar sections use a ~280ms expand transition.
      sidebarTimer = setTimeout(scrollSidebarToActive, 320);
    });
  },
);
</script>

<template>
  <Layout :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <template #nav-bar-content-before>
      <button
        v-if="hasSidebar"
        class="sidebar-toggle"
        type="button"
        :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-expanded="!sidebarCollapsed"
        aria-controls="VPSidebarNav"
        @click="toggleSidebar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
          <path
            :d="sidebarCollapsed ? 'm13 9 3 3-3 3' : 'm16 9-3 3 3 3'"
          />
        </svg>
      </button>
    </template>
    <template #home-hero-after>
      <HomeTopics />
    </template>
    <template #layout-bottom>
      <BackgroundEffects />
      <Fireworks />
    </template>
  </Layout>
</template>
