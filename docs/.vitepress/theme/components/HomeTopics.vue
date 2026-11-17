<script setup>
import { withBase } from "vitepress";
import { noteCategories, topicLink } from "../../navigation";
</script>

<template>
  <section class="home-topics" aria-labelledby="home-topics-title">
    <div class="home-topics__inner">
      <header class="home-topics__header">
        <p class="home-topics__eyebrow">目录</p>
        <h2 id="home-topics-title" class="home-topics__title">从这里开始翻</h2>
        <p class="home-topics__lead">六个方向，一份持续生长的笔记。从原理到实践，再到面试验证。</p>
      </header>

      <ul class="home-topics__list">
        <li v-for="(category, index) in noteCategories" :key="category.id" class="home-topics__category">
          <a class="home-topics__link" :href="withBase(category.link)">
            <span class="home-topics__index">{{
              String(index + 1).padStart(2, "0")
            }}</span>
            <span class="home-topics__copy">
              <span class="home-topics__name">{{ category.text }}</span>
              <span class="home-topics__desc">{{ category.description }}</span>
            </span>
            <span class="home-topics__arrow" aria-hidden="true">→</span>
          </a>
          <ul class="home-topics__children" :aria-label="category.text + '专题'">
            <li v-for="topic in category.items" :key="topic.id">
              <a :href="withBase(topicLink(category, topic))">{{ topic.text }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.home-topics {
  position: relative;
  z-index: 2;
  padding: 8px 24px 72px;
}

.home-topics__inner {
  max-width: 920px;
  margin: 0 auto;
}

.home-topics__header {
  margin: 0 0 20px;
  max-width: 28rem;
}

.home-topics__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}

.home-topics__title {
  margin: 0;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

.home-topics__lead {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.home-topics__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 22%, var(--vp-c-divider));
}

.home-topics__link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 4px;
  text-decoration: none;
  color: inherit;
  background: transparent;
  transition:
    background-color 180ms ease,
    border-color 180ms ease;
}

.home-topics__link:hover {
  background: color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent);
  border-bottom-color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-divider));
}

.home-topics__index {
  flex: 0 0 2rem;
  width: 2rem;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vp-c-brand-1);
  line-height: 1.4;
}

.home-topics__copy {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.home-topics__name {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.home-topics__desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.home-topics__arrow {
  flex: 0 0 auto;
  font-size: 1.1rem;
  color: var(--vp-c-brand-1);
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.home-topics__link:hover .home-topics__name {
  color: var(--vp-c-brand-1);
}

.home-topics__link:hover .home-topics__arrow {
  opacity: 1;
  transform: translateX(0);
}

.home-topics__category {
  border-bottom: 1px solid var(--vp-c-divider);
}

.home-topics__children {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  list-style: none;
  margin: 0;
  padding: 0 4px 18px 52px;
}

.home-topics__children a {
  display: inline-block;
  padding: 4px 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.6;
  text-decoration: none;
}

.home-topics__children a:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.home-topics a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
  border-radius: 2px;
}

@media (max-width: 639px) {
  .home-topics__link {
    gap: 12px;
  }

  .home-topics__children {
    padding-left: 48px;
    gap: 2px 16px;
  }

  .home-topics__children a {
    padding-block: 8px;
  }

  .home-topics__arrow {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-topics__link,
  .home-topics__arrow {
    transition: none;
  }
}
</style>
