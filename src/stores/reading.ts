import { defineStore } from "pinia";

import type { ExploreRequest, GeneratedReading } from "@/types/explore";

import { generateExploreReading } from "@/services/exploreService";
import { continueExploreReading } from "@/services/exploreService";

export const useReadingStore = defineStore("reading", {
  state: () => ({
    currentReading: null as GeneratedReading | null,
    isLoading: false,
    error: null as string | null,
    isContinuing: false,
  }),

  actions: {
    async generate(request: ExploreRequest, language: "it" | "en") {
      this.isLoading = true;
      this.error = null;
      this.currentReading = null;

      try {
        this.currentReading = await generateExploreReading(request, language);
      } catch {
        this.error = "Unable to generate reading.";
      } finally {
        this.isLoading = false;
      }
    },

    async continueReading() {
      if (!this.currentReading || this.isContinuing) {
        return;
      }

      this.isContinuing = true;

      try {
        const newSection = await continueExploreReading();

        this.currentReading.sections.push(newSection);
      } finally {
        this.isContinuing = false;
      }
    },

    clear() {
      this.currentReading = null;
      this.error = null;
    },
  },
});
