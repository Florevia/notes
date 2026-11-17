import { defineConfig } from "vitepress";
import { notesNav, notesSidebar } from "./navigation";
import { legacyCompatibilityPlugin, publishLegacyPages } from "./legacy";
import { withMermaid } from "vitepress-plugin-mermaid";
import { createRequire } from "module";
import { fileURLToPath, URL } from "node:url";

const require = createRequire(import.meta.url);
const requireFromVitePress = createRequire(require.resolve("vitepress"));
const inlineNavBarSearch = fileURLToPath(
  new URL("./theme/components/VPNavBarSearch.vue", import.meta.url),
);

/** Replace VitePress modal search with in-place expandable nav search. */
function inlineNavSearchPlugin() {
  return {
    name: "inline-nav-search",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        importer &&
        /vitepress[/\\].*VPNavBar\.vue/.test(importer) &&
        (source === "./VPNavBarSearch.vue" ||
          source.endsWith("VPNavBarSearch.vue"))
      ) {
        return inlineNavBarSearch;
      }
      return null;
    },
  };
}


// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "My notes",
    description: "前端开发、AI 与 Agent、工程架构与计算机基础的个人学习笔记",
    // localhost URLs are literal CORS teaching examples, not knowledge-base routes.
    // All actual internal article and asset links remain strictly checked.
    ignoreDeadLinks: [/^https?:\/\/localhost(?::\d+)?(?:\/.*)?$/],
    cleanUrls: true,
    buildEnd(site) {
      publishLegacyPages(site.outDir, site.site.base);
    },
    transformPageData(pageData) {
      if (pageData.frontmatter.status === 'planned') {
        pageData.frontmatter.search = false;
      }
    },
    head: [
      ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" }],
      ["link", { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48x48.png" }],
      ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
    ],
    vite: {
      plugins: [inlineNavSearchPlugin(), legacyCompatibilityPlugin()],
      resolve: {
        alias: [
          {
            find: /^@vueuse\/core$/,
            replacement: requireFromVitePress.resolve("@vueuse/core"),
          },
          {
            find: /^minisearch$/,
            replacement: requireFromVitePress.resolve("minisearch"),
          },
          {
            find: /^dayjs$/,
            replacement: require.resolve("dayjs/esm/index.js"),
          },
          {
            find: /^@braintree\/sanitize-url$/,
            replacement:
              require.resolve("@braintree/sanitize-url/dist/index.js"),
          },
        ],
      },
    },
    themeConfig: {
      logo: "/logo.jpg",
      outline: {
        level: "deep",
      },
      search: {
        provider: "local",
        options: {
          translations: {
            button: {
              buttonText: "搜索",
              buttonAriaLabel: "搜索文档",
            },
            modal: {
              displayDetails: "显示详细列表",
              resetButtonTitle: "重置搜索",
              backButtonTitle: "关闭搜索",
              noResultsText: "无结果",
              footer: {
                selectText: "选择",
                navigateText: "切换",
                closeText: "关闭",
              },
            },
          },
        },
      },
      // https://vitepress.dev/reference/default-theme-config
      nav: notesNav,
      sidebar: notesSidebar,

      socialLinks: [
        { icon: "github", link: "https://github.com/vuejs/vitepress" },
      ],
    },
  }),
);
