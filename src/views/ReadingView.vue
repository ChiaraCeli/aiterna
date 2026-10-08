<script setup lang="ts">
import { useRouter } from "vue-router";

import { useReadingStore } from "@/stores/reading";

const router = useRouter();
const readingStore = useReadingStore();

const goBack = () => {
  readingStore.clear();
  router.push({ name: "explore" });
};
</script>

<template>
  <main class="reading-view">
    <div class="reading-view__container">
      <button type="button" class="reading-view__back" @click="goBack">
        ←
      </button>

      <div v-if="readingStore.currentReading">
        <h1>
          {{ readingStore.currentReading.title }}
        </h1>

        <div class="reading-view__content">
          <section
            v-for="section in readingStore.currentReading.sections"
            :key="section.id"
            class="reading-section"
          >
            {{ section.content }}
          </section>
        </div>

        <button
          type="button"
          class="reading-view__more"
          :disabled="readingStore.isContinuing"
          @click="readingStore.continueReading()"
        >
          <span v-if="readingStore.isContinuing" class="loading-label">
            <span class="loading-star">✦</span>
            {{ $t("reading.continuing") }}
          </span>

          <span v-else>
            {{ $t("reading.tellMeMore") }}
          </span>
        </button>
        <p v-if="readingStore.error" class="reading-error">
          {{ $t("common.error") }}
        </p>
        <footer
          v-if="readingStore.currentReading.sources.length"
          class="reading-view__sources"
        >
          <span>Sources</span>

          <a
            v-for="source in readingStore.currentReading.sources"
            :key="source.url"
            :href="source.url"
            target="_blank"
            rel="noopener"
          >
            {{ source.title }}
          </a>
        </footer>
      </div>
    </div>
  </main>
</template>

<style scoped>
.reading-view {
  min-height: 100dvh;
  padding: 2rem var(--space-lg) 4rem;
}

.reading-view__container {
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
}

.reading-view__back {
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

.reading-view__back:hover {
  border-color: rgba(139, 114, 207, 0.6);
  color: var(--color-text-primary);
  transform: translateX(-2px);
}
.reading-view h1 {
  margin: 0 0 2rem;

  font-family: var(--font-reading);
  font-size: clamp(2rem, 7vw, 3.2rem);
  font-weight: 400;
  line-height: 1.15;
}

.reading-view__content {
  white-space: pre-line;

  color: var(--color-text-primary);

  font-family: var(--font-reading);
  font-size: 1.08rem;
  line-height: 1.85;
}

.reading-view__sources {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  margin-top: 3rem;
  padding-top: 1.5rem;

  border-top: 1px solid var(--color-border);

  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.reading-view__sources a {
  color: var(--color-accent-blue);
  text-decoration: none;
}

.reading-view__more {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  margin-top: 2.5rem;
  padding: 0.9rem 1rem;

  border: 1px solid var(--color-border);
  border-radius: 10px;

  background: rgba(16, 16, 28, 0.6);
  color: var(--color-text-secondary);

  cursor: pointer;

  transition:
    border-color var(--transition-normal),
    color var(--transition-normal),
    background-color var(--transition-normal);
}

.reading-view__more:hover:not(:disabled) {
  border-color: rgba(139, 114, 207, 0.5);
  background: rgba(24, 21, 42, 0.8);
  color: var(--color-text-primary);
}

.reading-view__more:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
