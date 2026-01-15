import DefaultTheme from "vitepress/theme";
import Mermaid from "vitepress-plugin-mermaid/Mermaid.vue";
import "./custom.css";

import Layout from "./Layout.vue";

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("Mermaid", Mermaid);
  },
};
