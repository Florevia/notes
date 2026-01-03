import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My notes",
  description: "Frontend learning notes",
  themeConfig: {
    outline: {
      level: "deep",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Frontend", link: "/frontend/JavaScript/" },
    ],

    sidebar: {
      "/frontend/HTML/": [
        {
          text: "HTML",
          items: [{ text: "Introduction", link: "/frontend/HTML/" }],
        },
      ],
      "/frontend/CSS/": [
        {
          text: "CSS",
          items: [
            { text: "CSS Selectors", link: "/frontend/CSS/css选择器.md" },
          ],
        },
      ],
      "/frontend/JavaScript/": [
        {
          text: "JavaScript",
          items: [
            {
              text: "ECMA-262",
              collapsed: false,
              items: [
                {
                  text: "ES2016",
                  collapsed: false,
                  items: [
                    {
                      text: "Class",
                      link: "/frontend/JavaScript/ecma-262/es2016/class.md",
                    },
                  ],
                },
                {
                  text: "ES2015",
                  collapsed: false,
                  items: [
                    {
                      text: "Promise",
                      link: "/frontend/JavaScript/ecma-262/es2015/Promise.md",
                    },
                  ],
                },
                {
                  text: "ES5",
                  collapsed: false,
                  items: [
                    {
                      text: "Iterator",
                      link: "/frontend/JavaScript/ecma-262/es5/iterator.md",
                    },
                  ],
                },
              ],
            },
            {
              text: "Frontend Frameworks",
              collapsed: false,
              items: [
                {
                  text: "Vue 3",
                  collapsed: false,
                  items: [
                    {
                      text: "Ref vs Reactive",
                      link: "/frontend/JavaScript/frontend-frameworks/vue3/ref-reactive.md",
                    },
                    {
                      text: "Array Reactivity",
                      link: "/frontend/JavaScript/frontend-frameworks/vue3/数组响应式原理.md",
                    },
                    {
                      text: "Dynamic Class & Style",
                      link: "/frontend/JavaScript/frontend-frameworks/vue3/动态绑定class和style.md",
                    },
                    {
                      text: "Scope Principle",
                      link: "/frontend/JavaScript/frontend-frameworks/vue3/scope原理.md",
                    },
                    {
                      text: "Slot Principle",
                      link: "/frontend/JavaScript/frontend-frameworks/vue3/slot.md",
                    },
                  ],
                },
              ],
            },
            {
              text: "JavaScript Flavours",
              collapsed: false,
              items: [
                {
                  text: "TypeScript",
                  link: "/frontend/JavaScript/JavaScript-Flavours/TypeScript.md",
                },
              ],
            },
            {
              text: "Backend",
              collapsed: false,
              items: [
                {
                  text: "Express",
                  link: "/frontend/JavaScript/backend/express/",
                },
                {
                  text: "Next.js",
                  link: "/frontend/JavaScript/backend/nextjs/",
                },
              ],
            },
          ],
        },
      ],
      "/frontend/notes/": [
        {
          text: "Notes",
          items: [{ text: "Debugging", link: "/frontend/notes/debug.md" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
