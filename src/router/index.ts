import { createRouter, createWebHistory } from "vue-router";

import LanguageView from "@/views/LanguageView.vue";
import HomeView from "@/views/HomeView.vue";
import ExploreView from "@/views/ExploreView.vue";
import StoriesView from "@/views/StoriesView.vue";
import ReadingView from '@/views/ReadingView.vue'

const LANGUAGE_STORAGE_KEY = "aiterna-language";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/",
      name: "language",
      component: LanguageView,
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
    },
    {
      path: "/explore",
      name: "explore",
      component: ExploreView,
    },
    {
      path: "/stories",
      name: "stories",
      component: StoriesView,
    },
    {
      path: "/reading",
      name: "reading",
      component: ReadingView,
    },
  ],
});

router.beforeEach((to) => {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (to.name === "language" && savedLanguage) {
    return { name: "home" };
  }

  if (to.name !== "language" && !savedLanguage) {
    return { name: "language" };
  }
});

export default router;
