<script setup>
import { useData } from "vitepress";
import { onMounted, onUnmounted, ref, computed } from "vue";

const { isDark, frontmatter } = useData();

// Check if we're on the homepage
const isHomepage = computed(() => frontmatter.value.layout === "home");

// Mouse position
const mouseX = ref(0);
const mouseY = ref(0);

// Trail particles
const trailParticles = ref([]);
const maxTrailLength = 12;
let particleId = 0;
let animationFrameId;
let lastTime = 0;

const handleMouseMove = (e) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

const updateTrail = (timestamp) => {
  // Throttle to ~30fps for trail updates
  if (timestamp - lastTime > 33) {
    lastTime = timestamp;

    // Add new particle
    trailParticles.value.push({
      id: particleId++,
      x: mouseX.value,
      y: mouseY.value,
      scale: 1,
      opacity: 0.8,
      rotation: Math.random() * 360,
    });

    // Remove old particles
    if (trailParticles.value.length > maxTrailLength) {
      trailParticles.value.shift();
    }

    // Update existing particles (fade out and shrink)
    trailParticles.value = trailParticles.value.map((p, index) => ({
      ...p,
      scale: (index / maxTrailLength) * 0.6 + 0.2,
      opacity: (index / maxTrailLength) * 0.6 + 0.1,
    }));
  }

  animationFrameId = requestAnimationFrame(updateTrail);
};

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("mousemove", handleMouseMove);
    animationFrameId = requestAnimationFrame(updateTrail);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("mousemove", handleMouseMove);
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<template>
  <div v-if="isHomepage" class="mouse-follower-container">
    <!-- Trail particles -->
    <div
      v-for="(particle, index) in trailParticles"
      :key="particle.id"
      class="trail-particle"
      :style="{
        left: particle.x + 'px',
        top: particle.y + 'px',
        transform: `translate(-50%, -50%) scale(${particle.scale}) rotate(${particle.rotation}deg)`,
        opacity: particle.opacity,
      }"
    >
      <svg viewBox="0 0 32 32" class="flower-svg">
        <!-- Flower petals -->
        <circle cx="16" cy="8" r="5" class="petal" />
        <circle cx="23" cy="12" r="5" class="petal" />
        <circle cx="23" cy="20" r="5" class="petal" />
        <circle cx="16" cy="24" r="5" class="petal" />
        <circle cx="9" cy="20" r="5" class="petal" />
        <circle cx="9" cy="12" r="5" class="petal" />
        <!-- Flower center -->
        <circle cx="16" cy="16" r="4" class="center" />
      </svg>
    </div>

    <!-- Main cursor flower -->
    <div
      class="cursor-flower"
      :style="{
        left: mouseX + 'px',
        top: mouseY + 'px',
      }"
    >
      <svg viewBox="0 0 32 32" class="flower-svg main-flower">
        <circle cx="16" cy="8" r="5" class="petal" />
        <circle cx="23" cy="12" r="5" class="petal" />
        <circle cx="23" cy="20" r="5" class="petal" />
        <circle cx="16" cy="24" r="5" class="petal" />
        <circle cx="9" cy="20" r="5" class="petal" />
        <circle cx="9" cy="12" r="5" class="petal" />
        <circle cx="16" cy="16" r="4" class="center" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.mouse-follower-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.cursor-flower {
  position: fixed;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: gentle-spin 8s linear infinite;
}

.trail-particle {
  position: fixed;
  width: 20px;
  height: 20px;
  pointer-events: none;
  transition: opacity 0.1s ease-out;
}

.flower-svg {
  width: 100%;
  height: 100%;
}

.flower-svg .petal {
  fill: #ff8fa3;
  filter: drop-shadow(0 0 3px rgba(255, 143, 163, 0.5));
}

.flower-svg .center {
  fill: #ffeb3b;
  filter: drop-shadow(0 0 2px rgba(255, 235, 59, 0.6));
}

.main-flower .petal {
  fill: #ff6b8a;
  filter: drop-shadow(0 0 6px rgba(255, 107, 138, 0.7));
}

.main-flower .center {
  fill: #ffd700;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8));
}

@keyframes gentle-spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
