<script setup>
import { nextTick, watch } from "vue";
import { useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import BackgroundEffects from "./components/BackgroundEffects.vue";
import Fireworks from "./components/Fireworks.vue";
import HomeTopics from "./components/HomeTopics.vue";
import SidebarFilter from "./components/SidebarFilter.vue";

const { Layout } = DefaultTheme;
const route = useRoute();

function scrollSidebarToActive() {
  const sidebar = document.querySelector(".VPSidebar");
  if (!sidebar) return;

  const active =
    sidebar.querySelector(".VPSidebarItem.is-active") ||
    sidebar.querySelector(".VPSidebarItem.has-active");
  if (!active) return;

  const target = active.querySelector(":scope > .item") || active;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
}

watch(
  () => route.path,
  async () => {
    await nextTick();
    requestAnimationFrame(() => {
      scrollSidebarToActive();
      // Sidebar expand uses ~280ms max-height transition
      setTimeout(scrollSidebarToActive, 320);
    });
  },
);
</script>

<template>
  <Layout>
    <template #sidebar-nav-before>
      <SidebarFilter />
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
