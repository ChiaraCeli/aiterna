<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useStoriesStore } from "@/stores/stories";

const router = useRouter();
const storiesStore = useStoriesStore();

const story = computed(() => storiesStore.currentStory);

const goBack = () => {
  router.push({ name: "stories" });
};

const handleChoice = async (sceneId: string, choiceId: string) => {
  if (storiesStore.isLoading) return;

  await storiesStore.continueCurrentStory(sceneId, choiceId);
};
</script>

<template>
  <main class="story-reading">
    <div class="story-reading__container">
      <button
        type="button"
        class="story-reading__back"
        aria-label="Back to Stories"
        @click="goBack"
      >
        ←
      </button>

      <template v-if="story">
        <h1 class="story-reading__title">
          {{ story.title || "Your story" }}
        </h1>

        <div class="story-reading__content">
          <section
            v-for="(scene, index) in story.scenes"
            :key="scene.id"
            class="story-scene"
          >
            <div class="story-scene__text">
              {{ scene.content }}
            </div>

            <div
              v-if="
                index === story.scenes.length - 1 && scene.choices.length > 0
              "
              class="story-choices"
            >
              <p class="story-choices__heading">What happens next?</p>

              <button
                v-for="(choice, choiceIndex) in scene.choices"
                :key="choice.id"
                type="button"
                class="story-choices__option"
                :class="{
                  'story-choices__option--selected':
                    scene.selectedChoiceId === choice.id,
                }"
                :disabled="
                  scene.selectedChoiceId !== null || storiesStore.isLoading
                "
                @click="handleChoice(scene.id, choice.id)"
              >
                <span class="story-choices__number">
                  {{ String(choiceIndex + 1).padStart(2, "0") }}
                </span>

                <span>{{ choice.text }}</span>
              </button>
            </div>
          </section>
        </div>

        <p v-if="storiesStore.isLoading" class="story-reading__loading">
          ✦ The story is unfolding...
        </p>

        <p v-if="storiesStore.error" class="story-reading__error" role="alert">
          {{ storiesStore.error }}
        </p>
      </template>
    </div>
  </main>
</template>

<style scoped>
.story-reading {
  min-height: 100dvh;
  padding: 2rem var(--space-lg) 4rem;
}

.story-reading__container {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.story-reading__back {
  display: grid;
  place-items: center;

  width: 56px;
  height: 56px;
  margin-bottom: 2.5rem;

  border: 1px solid var(--color-border);
  border-radius: 50%;

  background: transparent;
  color: var(--color-text-secondary);
  font-size: 1.75rem;
  cursor: pointer;

  transition:
    color var(--transition-normal),
    border-color var(--transition-normal),
    transform var(--transition-normal);
}

.story-reading__back:hover {
  border-color: rgba(139, 114, 207, 0.6);
  color: var(--color-text-primary);
  transform: translateX(-2px);
}

.story-reading__title {
  margin: 0 0 2.5rem;

  color: var(--color-text-primary);
  font-family: var(--font-reading);
  font-size: clamp(2rem, 7vw, 3.2rem);
  font-weight: 400;
  line-height: 1.15;
}

.story-reading__content {
  color: var(--color-text-primary);
  font-family: var(--font-reading);
  font-size: clamp(1.08rem, 1.5vw, 1.2rem);
  line-height: 1.9;
}

.story-scene + .story-scene {
  margin-top: 2.5rem;
  padding-top: 2.5rem;
  border-top: 1px solid var(--color-border);
}

.story-scene__text {
  white-space: pre-line;
  overflow-wrap: break-word;
}

.story-choices {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  margin-top: 3rem;
  padding-top: 2rem;

  border-top: 1px solid var(--color-border);
  font-family: inherit;
}

.story-choices__heading {
  margin: 0 0 0.75rem;

  color: var(--color-text-secondary);
  font-family: sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.03em;
}

.story-choices__option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  width: 100%;
  padding: 1rem 1.25rem;

  border: 1px solid var(--color-border);
  border-radius: 12px;

  background: rgba(16, 16, 28, 0.6);
  color: var(--color-text-primary);

  font-family: sans-serif;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: left;

  cursor: pointer;

  transition:
    border-color var(--transition-normal),
    background-color var(--transition-normal);
}

.story-choices__option:hover:not(:disabled) {
  border-color: rgba(139, 114, 207, 0.6);
  background: rgba(139, 114, 207, 0.12);
}

.story-choices__option--selected {
  border-color: var(--color-accent-purple);
  background: rgba(139, 114, 207, 0.15);
}

.story-choices__option:disabled:not(.story-choices__option--selected) {
  opacity: 0.45;
}

.story-choices__number {
  flex-shrink: 0;
  color: var(--color-accent-purple);
  font-size: 0.8rem;
}

.story-reading__loading {
  margin-top: 2rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.story-reading__error {
  margin-top: 2rem;
  color: var(--color-text-secondary);
}

@media (max-width: 600px) {
  .story-reading {
    padding: 1.5rem var(--space-lg) 3rem;
  }

  .story-reading__back {
    width: 46px;
    height: 46px;
    margin-bottom: 2rem;
  }

  .story-choices__option {
    padding: 0.9rem 1rem;
  }
}


.story-reading__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 32px 0;
  color: #b9b3ca;
  font-size: 0.9rem;
}

.story-reading__loading-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #b9a0e8;
  animation: story-pulse 1.4s ease-in-out infinite;
}

.story-reading__error {
  margin: 24px 0;
  color: #f2a6a6;
  font-size: 0.9rem;
  text-align: center;
}

@keyframes story-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

</style>
