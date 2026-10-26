<script setup>
const topics = [
  {
    title: "HTML",
    desc: "语义、图片与文档结构",
    link: "/frontend/HTML/图片类型及选择",
  },
  {
    title: "CSS",
    desc: "布局、视觉与移动端适配",
    link: "/frontend/CSS/css选择器",
  },
  {
    title: "JavaScript",
    desc: "语言核心、异步与模块化",
    link: "/interview/js/var-let-const",
  },
  {
    title: "浏览器",
    desc: "渲染、存储与 Web API",
    link: "/interview/浏览器/浏览器组成",
  },
  {
    title: "网络",
    desc: "HTTP、缓存、跨域与安全",
    link: "/interview/网络/输入URL后",
  },
  {
    title: "Vue",
    desc: "响应式、组件与路由状态",
    link: "/frontend/JavaScript/frontend-frameworks/vue3/ref-reactive",
  },
  {
    title: "工程化",
    desc: "构建、质量与协作流程",
    link: "/interview/前端工程化/前端工程化的理解",
  },
  {
    title: "业务实战",
    desc: "场景题与真实落地笔记",
    link: "/interview/业务场景/拖拽组件",
  },
];
</script>

<template>
  <section class="home-topics" aria-labelledby="home-topics-title">
    <div class="home-topics__inner">
      <header class="home-topics__header">
        <p class="home-topics__eyebrow">目录</p>
        <h2 id="home-topics-title" class="home-topics__title">从这里开始翻</h2>
        <p class="home-topics__lead">按主题进入笔记，不必从零翻侧边栏。</p>
      </header>

      <ul class="home-topics__list">
        <li v-for="(topic, index) in topics" :key="topic.link">
          <a class="home-topics__link" :href="topic.link">
            <span class="home-topics__index">{{
              String(index + 1).padStart(2, "0")
            }}</span>
            <span class="home-topics__copy">
              <span class="home-topics__name">{{ topic.title }}</span>
              <span class="home-topics__desc">{{ topic.desc }}</span>
            </span>
            <span class="home-topics__arrow" aria-hidden="true">→</span>
          </a>
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
  border-bottom: 1px solid var(--vp-c-divider);
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

@media (max-width: 639px) {
  .home-topics__arrow {
    display: none;
  }
}
</style>
