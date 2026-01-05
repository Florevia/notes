<script setup>
import DefaultTheme from "vitepress/theme";
import BackgroundEffects from "./components/BackgroundEffects.vue";
import Fireworks from "./components/Fireworks.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #layout-bottom>
      <BackgroundEffects />
      <Fireworks />
    </template>
  </Layout>
</template>
