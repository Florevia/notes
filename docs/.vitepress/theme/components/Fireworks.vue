<script setup>
import { onMounted, onUnmounted } from "vue";
import confetti from "canvas-confetti";

// Fireworks effect function
const triggerFireworks = (event) => {
  const rect = event.target.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  // Create a burst of confetti from the button position
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x, y },
    colors: ["#ff6b8a", "#ff8fa3", "#ffc0cb", "#ffb6c1", "#ffd700", "#87ceeb"],
    ticks: 200,
    gravity: 1.2,
    scalar: 1.2,
    shapes: ["circle", "square"],
    disableForReducedMotion: true,
  });
};

// Handle all button clicks
const handleClick = (event) => {
  const target = event.target;
  // Check if the clicked element is a button or VPButton
  if (
    target.tagName === "BUTTON" ||
    target.classList.contains("VPButton") ||
    target.closest(".VPButton") ||
    target.closest("button")
  ) {
    triggerFireworks(event);
  }
};

onMounted(() => {
  if (typeof window !== "undefined") {
    document.addEventListener("click", handleClick);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    document.removeEventListener("click", handleClick);
  }
});
</script>

<template>
  <!-- This component adds fireworks effect to all buttons, no visible template needed -->
  <div class="fireworks-handler" aria-hidden="true"></div>
</template>

<style scoped>
.fireworks-handler {
  display: none;
}
</style>
