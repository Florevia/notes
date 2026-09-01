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
