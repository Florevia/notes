<script setup>
import { computed } from 'vue';
import { useData, useRoute, withBase } from 'vitepress';
import { findKnowledgeContext, topicLink } from '../../navigation';
const route = useRoute();
const { frontmatter } = useData();
const context = computed(() => findKnowledgeContext(route.path));
const crumbs = computed(() => {
  if (!context.value) return [];
  const { category, parents } = context.value;
  return [{ text: category.text, link: category.link }, ...parents.filter(p => p.directory).map(p => ({ text: p.text, link: topicLink(category,p) }))];
});
const supplementLinks = computed(() => context.value?.topic.related ?? []);
</script>

<template>
  <div v-if="context" class="knowledge-context">
    <nav aria-label="知识归属" class="knowledge-context__trail">
      <a :href="withBase('/')">知识库</a>
      <template v-for="crumb in crumbs" :key="crumb.link">
        <span aria-hidden="true">/</span>
        <a :href="withBase(crumb.link)">{{ crumb.text }}</a>
      </template>
    </nav>
    <p v-if="frontmatter.status === 'planned'" class="knowledge-context__notice">
      待补充：此条目保留了原有空白笔记的位置，尚无独立正文。请先查阅所属专题中的已有文章。
    </p>
    <p v-else-if="frontmatter.status === 'outline'" class="knowledge-context__notice">
      提纲：保留原有简记，尚未整理成完整文章。可沿专题入口继续学习。
    </p>
    <p v-if="context.topic.role === 'supplement' || context.topic.role === 'answer'" class="knowledge-context__related">
      {{ context.topic.role === 'answer' ? '面试口述稿' : '补充笔记' }} ·
      <a v-for="link in supplementLinks" :key="link.link" :href="withBase(link.link)">{{ link.text }}</a>
    </p>
  </div>
</template>

<style scoped>
.knowledge-context { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--vp-c-divider); }
.knowledge-context__trail { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; font-size: 13px; line-height: 1.7; }
.knowledge-context__trail a { color: var(--vp-c-text-2); text-decoration: none; }
.knowledge-context__trail span { color: var(--vp-c-text-3); }
.knowledge-context__trail a:hover { color: var(--vp-c-brand-1); }
.knowledge-context__notice, .knowledge-context__related { margin: 12px 0 0; font-size: 13px; line-height: 1.8; color: var(--vp-c-text-2); }
.knowledge-context__related a { color: var(--vp-c-brand-1); text-underline-offset: 3px; }
a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 4px; }
</style>
