import { defineStore } from "pinia";

import type { ExploreRequest, GeneratedReading } from "@/types/explore";

import { generateExploreReading } from "@/services/exploreService";
import { continueExploreReading } from "@/services/exploreService";

let generationController: AbortController | null = null;
let continuationController: AbortController | null = null;

export const useReadingStore = defineStore("reading", {
  state: () => ({
    currentReading: null as GeneratedReading | null,
    isLoading: false,
    error: null as string | null,
    isContinuing: false,

    recentArticleIds: {
      it: [] as number[],
      en: [] as number[],
    },
  }),

  actions: {
    rememberArticle(articleId: number, language: "it" | "en") {
      const recent = this.recentArticleIds[language];

      const existingIndex = recent.indexOf(articleId);

      if (existingIndex !== -1) {
        recent.splice(existingIndex, 1);
      }

      recent.push(articleId);

      if (recent.length > 20) {
        recent.shift();
      }
    },

    async generate(
      request: ExploreRequest,
      language: "it" | "en",
      onReady?: () => void,
    ) {
      generationController?.abort();
      continuationController?.abort();

      continuationController = null;
      this.isContinuing = false;

      const controller = new AbortController();
      generationController = controller;
      this.isLoading = true;
      this.error = null;
      this.currentReading = null;

      try {
        await generateExploreReading(
          {
            ...request,
            recentArticleIds: [...this.recentArticleIds[language]],
          },
          language,

          {
            onMetadata: (metadata) => {
              if (controller.signal.aborted) return;

              if (typeof metadata.articleId === "number") {
                this.rememberArticle(metadata.articleId, language);
              }

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

    async continueReading(language: "it" | "en") {
      if (!this.currentReading || this.isContinuing || this.isLoading) {
        return;
      }

      const reading = this.currentReading;
      const sourceUrl = reading.sources[0]?.url;

      if (!sourceUrl) {
        this.error = "Unable to find the reading source.";
        return;
      }

      const previousContent = reading.sections
        .map((section) => section.content)
        .join("\n\n");

      const controller = new AbortController();
      continuationController = controller;

      const newSection = {
        id: `continuation-${Date.now()}`,
        content: "",
      };

      reading.sections.push(newSection);

      this.isContinuing = true;
      this.error = null;

      try {
        await continueExploreReading(
          {
            title: reading.title,
            previousContent,
            sourceUrl,
            language,
          },

          (content) => {
            if (controller.signal.aborted) return;

            const section = this.currentReading?.sections.find(
              (section) => section.id === newSection.id,
            );

            if (section) {
              section.content += content;
            }
          },

          controller.signal,
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Reading continuation error:", error);

          this.error = "Unable to continue reading.";

          if (!newSection.content) {
            const index = reading.sections.indexOf(newSection);

            if (index !== -1) {
              reading.sections.splice(index, 1);
            }
          }
        }
      } finally {
        if (continuationController === controller) {
          continuationController = null;
          this.isContinuing = false;
        }
      }
    },

    clear() {
      generationController?.abort();
      continuationController?.abort();

      generationController = null;
      continuationController = null;

      this.currentReading = null;
      this.error = null;
      this.isLoading = false;
      this.isContinuing = false;
    },
  },
});
