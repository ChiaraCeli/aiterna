import { defineStore } from "pinia";
import { generateStory, continueStoryStream } from "@/services/storiesService";

import type {
  InteractiveStory,
  StoryChoice,
  StoryScene,
} from "@/types/stories";

export const useStoriesStore = defineStore("stories", {
  state: () => ({
    currentStory: null as InteractiveStory | null,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async startStory(prompt: string, language: "it" | "en") {
      if (this.isLoading) return false;

      this.isLoading = true;
      this.error = null;

      try {
        const generatedStory = await generateStory({
          prompt,
          language,
        });

        this.currentStory = {
          id: crypto.randomUUID(),
          prompt,
          title: generatedStory.title,
          language,
          scenes: [],
        };

        this.addScene(generatedStory.content, generatedStory.choices);

        return true;
      } catch (error) {
        console.error("Story generation failed:", error);

        this.error = "Unable to generate story. Please try again.";

        return false;
      } finally {
        this.isLoading = false;
      }
    },

    addScene(content: string, choices: StoryChoice[]) {
      if (!this.currentStory) return;

      const scene: StoryScene = {
        id: crypto.randomUUID(),
        content,
        choices,
        selectedChoiceId: null,
      };

      this.currentStory.scenes.push(scene);
    },

    appendSceneContent(sceneId: string, chunk: string) {
      if (!this.currentStory) return;

      const scene = this.currentStory.scenes.find(
        (scene) => scene.id === sceneId,
      );

      if (!scene) return;

      scene.content += chunk;
    },

    setSceneChoices(sceneId: string, choices: StoryChoice[]) {
      if (!this.currentStory) return;

      const scene = this.currentStory.scenes.find(
        (scene) => scene.id === sceneId,
      );

      if (!scene) return;

      scene.choices = choices;
    },

    selectChoice(sceneId: string, choiceId: string) {
      if (!this.currentStory) return;

      const scene = this.currentStory.scenes.find(
        (scene) => scene.id === sceneId,
      );

      if (!scene) return;

      const choiceExists = scene.choices.some(
        (choice) => choice.id === choiceId,
      );

      if (!choiceExists || scene.selectedChoiceId !== null) return;

      scene.selectedChoiceId = choiceId;
    },

    async continueCurrentStory(sceneId: string, choiceId: string) {
      if (!this.currentStory || this.isLoading) return false;

      const storyId = this.currentStory.id;
      const previousScene = this.currentStory.scenes.at(-1);

      if (
        !previousScene ||
        previousScene.id !== sceneId ||
        previousScene.selectedChoiceId !== null ||
        !previousScene.choices.some((choice) => choice.id === choiceId)
      ) {
        return false;
      }

      this.isLoading = true;
      this.error = null;

      try {
        this.selectChoice(sceneId, choiceId);

        // La richiesta deve contenere solo le scene precedenti,
        // con l'ultima scelta appena selezionata.
        const storySnapshot = JSON.parse(
          JSON.stringify(this.currentStory),
        ) as InteractiveStory;

        // Creiamo subito la nuova scena vuota.
        this.addScene("", []);

        const newScene = this.currentStory.scenes.at(-1);

        if (!newScene) {
          throw new Error("Unable to create the new scene.");
        }

        const newSceneId = newScene.id;

        await continueStoryStream(storySnapshot, {
          onChunk: (content) => {
            if (this.currentStory?.id !== storyId) return;
            this.appendSceneContent(newSceneId, content);
          },

          onChoices: (choices) => {
            if (this.currentStory?.id !== storyId) return;
            this.setSceneChoices(newSceneId, choices);
          },
        });

        return true;
      } catch (error) {
        console.error("Story continuation failed:", error);

        if (this.currentStory?.id === storyId) {
          // Rimuoviamo la scena incompleta e permettiamo
          // all'utente di riprovare la stessa scelta.
          const lastScene = this.currentStory.scenes.at(-1);

          if (lastScene && lastScene.id !== sceneId) {
            this.currentStory.scenes.pop();
          }

          const originalScene = this.currentStory.scenes.find(
            (scene) => scene.id === sceneId,
          );

          if (originalScene) {
            originalScene.selectedChoiceId = null;
          }

          this.error = "Unable to continue story. Please try again.";
        }

        return false;
      } finally {
        this.isLoading = false;
      }
    },

    clearStory() {
      this.currentStory = null;
      this.isLoading = false;
      this.error = null;
    },
  },
});
