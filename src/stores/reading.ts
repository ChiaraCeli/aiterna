import { defineStore } from "pinia";

import type { ExploreRequest, GeneratedReading } from "@/types/explore";

import { generateExploreReading } from "@/services/exploreService";
import { continueExploreReading } from "@/services/exploreService";

let generationController: AbortController | null = null;

export const useReadingStore = defineStore("reading", {
  state: () => ({
    currentReading: null as GeneratedReading | null,
    isLoading: false,
    error: null as string | null,
    isContinuing: false,
  }),

  actions: {
    async generate(
      request: ExploreRequest,
      language: "it" | "en",
      onReady?: () => void,
    ) {
      const controller = new AbortController();
      generationController = controller;
      this.isLoading = true;
      this.error = null;
      this.currentReading = null;

      try {
        await generateExploreReading(
          request,
          language,
          {
            onMetadata: (metadata) => {
              if (controller.signal.aborted) return;

              this.currentReading = {
                title: metadata.title,
                sources: metadata.sources,
                sections: [
                  {
                    id: "initial",
                    content: "",
                  },
                ],
              };

              onReady?.();
            },

            onChunk: (content) => {
              if (controller.signal.aborted || !this.currentReading) return;

              this.currentReading.sections[0]!.content += content;
            },
          },
          controller.signal,
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Reading generation error:", error);
          this.error = "Unable to generate reading.";
        }
      } finally {
        if (generationController === controller) {
          generationController = null;
          this.isLoading = false;
        }
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
      generationController?.abort();
      generationController = null;

      this.currentReading = null;
      this.error = null;
      this.isLoading = false;
    },
  },
});
