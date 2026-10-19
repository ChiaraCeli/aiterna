<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useStoriesStore } from "@/stores/stories";

const router = useRouter();
const storiesStore = useStoriesStore();

const storyPrompt = ref("");

const canGenerate = computed(() => storyPrompt.value.trim().length > 0);

const startStory = async () => {
  if (!canGenerate.value || storiesStore.isLoading) return;

  const success = await storiesStore.startStory(storyPrompt.value.trim(), "en");

  if (success) {
    router.push({ name: "story-reading" });
  }
};
</script>

<template>
  <main class="stories-view">
    <div class="stories-view__container">
      <header class="stories-view__header">
        <span class="stories-view__eyebrow">✦ AIterna Stories</span>

        <h1>Every story begins somewhere.</h1>

        <p>
          Imagine a world, a character, or a moment. Give us the beginning, and
          let the story unfold.
        </p>
      </header>

      <form class="stories-view__form" @submit.prevent="startStory">
        <label for="story-prompt" class="stories-view__label">
          Your story begins with...
        </label>

        <textarea
          id="story-prompt"
          v-model="storyPrompt"
          class="stories-view__textarea"
          placeholder="A girl discovers a forgotten library where every book contains a different version of her life..."
          rows="6"
          maxlength="2000"
        ></textarea>

        <div class="stories-view__form-footer">
          <span class="stories-view__hint">
            Just a thought is enough. The rest is up to the story.
          </span>

          <span class="stories-view__counter">
            {{ storyPrompt.length }}/2000
          </span>
        </div>

        <button
          type="submit"
          class="stories-view__button"
          :disabled="!canGenerate || storiesStore.isLoading"
        >
          {{
            storiesStore.isLoading ? "Creating your story..." : "Begin story"
          }}

          <span aria-hidden="true">→</span>
        </button>

        <p v-if="storiesStore.error" class="stories-view__error" role="alert">
          {{ storiesStore.error }}
        </p>
      </form>
    </div>
  </main>
</template>

<style scoped>
.stories-view {
  min-height: 100dvh;
  padding: 5rem var(--space-lg) 4rem;
}

.stories-view__container {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
}

.stories-view__header {
  margin-bottom: 3rem;
  text-align: center;
}

.stories-view__eyebrow {
  display: inline-block;
  margin-bottom: 1.5rem;

  color: var(--color-accent-purple);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stories-view h1 {
  margin: 0 0 1.25rem;

  color: var(--color-text-primary);
  font-family: var(--font-reading);
  font-size: clamp(2.2rem, 6vw, 3.5rem);
  font-weight: 400;
  line-height: 1.15;
}

.stories-view__header p {
  max-width: 480px;
  margin: 0 auto;

  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.stories-view__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stories-view__label {
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.stories-view__textarea {
  width: 100%;
  min-height: 180px;
  padding: 1.25rem;

  border: 1px solid var(--color-border);
  border-radius: 14px;
  outline: none;

  background: rgba(16, 16, 28, 0.6);
  color: var(--color-text-primary);

  font-family: inherit;
  font-size: 1rem;
  line-height: 1.7;

  resize: vertical;

  transition: border-color var(--transition-normal);
}

.stories-view__textarea::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.stories-view__textarea:focus {
  border-color: var(--color-accent-purple);
}

.stories-view__form-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.stories-view__hint,
.stories-view__counter {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}

.stories-view__counter {
  flex-shrink: 0;
}

.stories-view__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;

  width: 100%;
  margin-top: 1rem;
  padding: 1rem 1.5rem;

  border: 1px solid rgba(139, 114, 207, 0.5);
  border-radius: 12px;

  background: rgba(139, 114, 207, 0.15);
  color: var(--color-text-primary);

  font-size: 1rem;
  cursor: pointer;

  transition:
    background-color var(--transition-normal),
    border-color var(--transition-normal);
}

.stories-view__button:hover:not(:disabled) {
  background: rgba(139, 114, 207, 0.25);
  border-color: var(--color-accent-purple);
}

.stories-view__button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stories-view__error {
  margin-top: 1rem;
  color: #f2a6a6;
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 600px) {
  .stories-view {
    padding-top: 3rem;
  }

  .stories-view__header {
    margin-bottom: 2.5rem;
  }

  .stories-view__form-footer {
    flex-direction: column;
    gap: 0.25rem;
  }

  .stories-view__counter {
    align-self: flex-end;
  }
}
</style>
