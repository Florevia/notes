import type { DefaultTheme } from 'vitepress';
import tree from './knowledge-tree.json' with { type: 'json' };

export interface TopicNode {
  id: string;
  text: string;
  link?: string;
  indexLink?: string;
  directory?: string;
  description?: string;
  learningPath?: string[];
  items?: TopicNode[];
  references?: { text: string; link: string }[];
  related?: { text: string; link: string }[];
  status?: 'planned' | 'outline';
  role?: string;
  note?: string;
}
export interface NoteCategory extends TopicNode {
  link: string;
  description: string;
  items: TopicNode[];
}

/** One knowledge tree drives home, menus, entry documents and reading context. */
export const noteCategories = tree as NoteCategory[];
export function topicLink(category: NoteCategory, topic: TopicNode): string {
  return topic.indexLink ?? topic.link ?? category.link + '#' + topic.id;
}
export function topicLabel(topic: TopicNode): string {
  return topic.text + (topic.status === 'planned' ? '（待补充）' : topic.status === 'outline' ? '（提纲）' : '');
}
function sidebarItems(category: NoteCategory, topics: TopicNode[]): DefaultTheme.SidebarItem[] {
  return topics.map(topic => ({
    text: topicLabel(topic),
    link: topicLink(category, topic),
    ...(topic.items?.length ? { collapsed: true, items: sidebarItems(category, topic.items) } : {}),
  }));
}
export const notesSidebar: DefaultTheme.SidebarMulti = Object.fromEntries(noteCategories.map(category => [category.link, [
  { text: category.text + ' · 学习导航', link: category.link },
  ...sidebarItems(category, category.items),
]]));
export const notesNav: DefaultTheme.NavItem[] = noteCategories.map(category => ({
  text: category.text,
  link: category.link,
  activeMatch: '^' + category.link,
}));

export function findKnowledgeContext(path: string) {
  const route = decodeURI(path).replace(/\.html$/, '').replace(/\/index$/, '/');
  const category = noteCategories.find(c => route.startsWith(c.link));
  if (!category) return null;
  const walk = (nodes: TopicNode[], parents: TopicNode[]): { category: NoteCategory; topic: TopicNode; parents: TopicNode[] } | null => {
    for (const topic of nodes) {
      if (topic.link === route || topic.indexLink === route) return { category, topic, parents };
      const found = walk(topic.items ?? [], [...parents, topic]);
      if (found) return found;
    }
    return null;
  };
  return walk(category.items, []) ?? { category, topic: category, parents: [] };
}
