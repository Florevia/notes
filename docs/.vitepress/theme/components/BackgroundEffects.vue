<script setup>
import { useData } from "vitepress";
import { onMounted, onUnmounted, ref, computed } from "vue";

const { frontmatter } = useData();

// Check if we're on the homepage
const isHomepage = computed(() => frontmatter.value.layout === "home");

const snowflakes = ref([]);
const containerRef = ref(null);

// Create snowflakes
const generateSnowflakes = () => {
  const flakes = [];
  const count = 50; // Number of snowflakes

  for (let i = 0; i < count; i++) {
    flakes.push({
      id: i,
      x: Math.random() * 100, // Random horizontal position (%)
      size: Math.random() * 10 + 8, // 8px to 18px
      duration: Math.random() * 8 + 10, // 10-18 seconds to fall
      delay: Math.random() * 15, // Random start delay
      sway: Math.random() * 30 + 20, // Horizontal sway amount
      opacity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8 opacity
    });
  }
  snowflakes.value = flakes;
};

onMounted(() => {
  generateSnowflakes();
});
</script>

<template>
  <div
    v-if="isHomepage"
    ref="containerRef"
    class="background-effects-container"
  >
    <div
      v-for="flake in snowflakes"
      :key="flake.id"
      class="snowflake"
      :style="{
        left: flake.x + '%',
        '--size': flake.size + 'px',
        '--duration': flake.duration + 's',
        '--delay': flake.delay + 's',
        '--sway': flake.sway + 'px',
        '--opacity': flake.opacity,
      }"
    >
      <!-- Snowflake SVG -->
      <svg viewBox="0 0 100 100" class="snowflake-svg">
        <!-- Main snowflake branches -->
        <g
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        >
          <!-- Vertical line -->
          <line x1="50" y1="5" x2="50" y2="95" />
          <!-- Diagonal lines -->
          <line x1="10" y1="27" x2="90" y2="73" />
          <line x1="10" y1="73" x2="90" y2="27" />

          <!-- Small branches on vertical -->
          <line x1="50" y1="20" x2="40" y2="30" />
          <line x1="50" y1="20" x2="60" y2="30" />
          <line x1="50" y1="80" x2="40" y2="70" />
          <line x1="50" y1="80" x2="60" y2="70" />

          <!-- Small branches on diagonals -->
          <line x1="25" y1="36" x2="25" y2="50" />
          <line x1="75" y1="36" x2="75" y2="50" />
          <line x1="25" y1="64" x2="25" y2="50" />
          <line x1="75" y1="64" x2="75" y2="50" />
        </g>
        <!-- Center circle -->
        <circle cx="50" cy="50" r="6" fill="currentColor" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.background-effects-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.snowflake {
  position: absolute;
  top: -50px;
  width: var(--size);
  height: var(--size);
  color: #ffb6c1; /* Pink color */
  opacity: var(--opacity);
  animation: snowfall var(--duration) linear infinite;
  animation-delay: var(--delay);
  filter: drop-shadow(0 0 3px rgba(255, 182, 193, 0.5));
}

.snowflake-svg {
  width: 100%;
  height: 100%;
}

@keyframes snowfall {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: var(--opacity);
  }
  50% {
    transform: translateY(50vh) translateX(var(--sway)) rotate(180deg);
  }
  95% {
    opacity: var(--opacity);
  }
  100% {
    transform: translateY(110vh) translateX(calc(var(--sway) * -1))
      rotate(360deg);
    opacity: 0;
  }
}

/* Add gentle glow effect on hover for visual interest */
.snowflake:hover {
  opacity: 1;
  filter: drop-shadow(0 0 8px rgba(255, 182, 193, 0.8));
}
</style>
