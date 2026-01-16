import DefaultTheme from "vitepress/theme";
import Mermaid from "vitepress-plugin-mermaid/Mermaid.vue";
import "./custom.css";

import Layout from "./Layout.vue";

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app, router }) {
    app.component("Mermaid", Mermaid);

    if (typeof window !== "undefined") {
      router.onBeforeRouteChange = (to) => {
        if (document.startViewTransition && to !== router.route.path) {
          router.viewTransitionPromise = new Promise((resolve) => {
            router.viewTransitionResolve = resolve;
          });

          const transition = document.startViewTransition(() => {
            return router.viewTransitionPromise;
          });
        }
      };

      router.onAfterRouteChanged = () => {
        if (router.viewTransitionResolve) {
          router.viewTransitionResolve();
          router.viewTransitionResolve = null;
        }
      };
    }
  },
};
