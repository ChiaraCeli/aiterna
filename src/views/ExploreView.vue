<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useReadingStore } from "@/stores/reading";
import { usePreferencesStore } from "@/stores/preferences";

import type { ExploreCategory, ReadingLength } from "@/types/explore";

interface Category {
  id: ExploreCategory;
  emoji: string;
}

const categories: Category[] = [
  { id: "surprise", emoji: "🎲" },
  { id: "history", emoji: "🏺" },
  { id: "nature", emoji: "🌿" },
  { id: "animals", emoji: "🐾" },
  { id: "space", emoji: "🪐" },
  { id: "places", emoji: "🗺️" },
  { id: "curiosities", emoji: "✨" },
  { id: "psychology", emoji: "🧠" },
  { id: "mysteries", emoji: "🔮" },
  { id: "crime", emoji: "🔎" },
  { id: "custom", emoji: "💭" },
];

const selectedCategory = ref<ExploreCategory | null>(null);
const selectedLength = ref<ReadingLength>("medium");
const customTopic = ref("");
const router = useRouter();
const readingStore = useReadingStore();
const preferencesStore = usePreferencesStore();

const isCustomCategory = computed(() => selectedCategory.value === "custom");

const canBegin = computed(() => {
  if (!selectedCategory.value) {
    return false;
  }

  if (isCustomCategory.value) {
    return customTopic.value.trim().length > 0;
  }

  return true;
});

const selectCategory = (category: ExploreCategory) => {
  selectedCategory.value = category;
};

const beginExploration = () => {
  if (!canBegin.value || !selectedCategory.value || readingStore.isLoading) {
    return;
  }

  void readingStore.generate(
    {
      category: selectedCategory.value,
      length: selectedLength.value,
      customTopic:
        selectedCategory.value === "custom"
          ? customTopic.value.trim()
          : undefined,
    },
    preferencesStore.language ?? "en",
    () => {
      void router.push({ name: "reading" });
    },
  );
};
</script>

<template>
  <main class="explore-view">
    <div class="explore-view__container">
      <header class="explore-view__header">
        <RouterLink
          :to="{ name: 'home' }"
          class="explore-view__back"
          aria-label="Back"
        >
          ←
        </RouterLink>

        <div>
          <h1>{{ $t("explore.title") }}</h1>
          <p>{{ $t("explore.subtitle") }}</p>
        </div>
      </header>

      <section class="explore-section">
        <div class="category-grid">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="category-card"
            :class="{
              'category-card--selected': selectedCategory === category.id,
            }"
            @click="selectCategory(category.id)"
          >
            <span class="category-card__emoji">
              {{ category.emoji }}
            </span>

            <span class="category-card__label">
              {{ $t(`explore.categories.${category.id}`) }}
            </span>
          </button>
        </div>

        <Transition name="topic">
          <div v-if="isCustomCategory" class="custom-topic">
            <input
              v-model="customTopic"
              type="text"
              class="custom-topic__input"
              :placeholder="$t('explore.customTopic.placeholder')"
              maxlength="120"
            />
          </div>
        </Transition>
      </section>

      <section class="explore-section explore-section--length">
        <p class="explore-section__title">
          {{ $t("explore.length.title") }}
        </p>

        <div class="length-selector">
          <button
            v-for="length in ['short', 'medium', 'long'] as ReadingLength[]"
            :key="length"
            type="button"
            class="length-option"
            :class="{
              'length-option--selected': selectedLength === length,
            }"
            @click="selectedLength = length"
          >
            {{ $t(`explore.length.${length}`) }}
          </button>
        </div>
      </section>

      <button
        type="button"
        class="begin-button"
        :disabled="!canBegin || readingStore.isLoading"
        @click="beginExploration"
      >
        <span v-if="readingStore.isLoading" class="loading-label">
          <span class="loading-star">✦</span>
          {{ $t("explore.loading") }}
        </span>

        <span v-else>
          {{ $t("explore.begin") }}
          <span aria-hidden="true">✦</span>
        </span>
      </button>
      <p v-if="readingStore.error" class="explore-error">
        {{ $t("common.error") }}
      </p>
    </div>
  </main>
</template>

<style scoped>
.explore-view {
  min-height: 100dvh;
  padding: 2rem var(--space-lg) 3rem;
}

.explore-view__container {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}

.explore-view__header {
  position: relative;

  display: flex;
  justify-content: center;

  margin-bottom: 2.5rem;

  text-align: center;
}

.explore-view__header h1 {
  margin: 0;

  font-family: var(--font-reading);
  font-size: 2rem;
  font-weight: 400;
}

.explore-view__header p {
  margin: 0.35rem 0 0;

  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.explore-view__back {
  position: absolute;
  top: 50%;
  left: 0;

  display: grid;
  place-items: center;

  width: 56px;
  height: 56px;

  border: 1px solid var(--color-border);
  border-radius: 50%;

  color: var(--color-text-secondary);
  font-size: 1.75rem;
  text-decoration: none;

  transform: translateY(-50%);

  transition:
    color var(--transition-normal),
    border-color var(--transition-normal),
    transform var(--transition-normal);
}

.explore-view__back:hover {
  border-color: rgba(139, 114, 207, 0.6);
  color: var(--color-text-primary);

  transform: translateX(-2px);
}

.explore-section {
  margin-bottom: 2.5rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  min-height: 58px;
  padding: 0.8rem 0.9rem;

  border: 1px solid var(--color-border);
  border-radius: 10px;

  background: rgba(16, 16, 28, 0.7);

  color: var(--color-text-secondary);
  text-align: left;

  cursor: pointer;

  transition:
    border-color var(--transition-normal),
    background-color var(--transition-normal),
    color var(--transition-normal),
    transform var(--transition-fast),
    box-shadow var(--transition-normal);
}

.category-card:hover {
  border-color: rgba(139, 114, 207, 0.45);

  background: rgba(24, 21, 42, 0.85);
  color: var(--color-text-primary);

  transform: translateY(-1px);
}

.category-card--selected {
  border-color: rgba(139, 114, 207, 0.75);

  background: rgba(44, 35, 73, 0.55);
  color: var(--color-text-primary);

  box-shadow: 0 0 20px rgba(139, 114, 207, 0.08);
}

.category-card__emoji {
  flex: 0 0 auto;

  font-size: 1.15rem;
}

.category-card__label {
  font-size: 0.78rem;
  line-height: 1.25;
}

.custom-topic {
  margin-top: var(--space-md);
}

.custom-topic__input {
  width: 100%;
  padding: 0.9rem 1rem;

  border: 1px solid rgba(139, 114, 207, 0.4);
  border-radius: 10px;
  outline: none;

  background: rgba(16, 16, 28, 0.8);
  color: var(--color-text-primary);

  transition:
    border-color var(--transition-normal),
    box-shadow var(--transition-normal);
}

.custom-topic__input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.65;
}

.custom-topic__input:focus {
  border-color: var(--color-accent-purple);
  box-shadow: 0 0 20px rgba(139, 114, 207, 0.1);
}

.explore-section__title {
  margin: 0 0 var(--space-md);

  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.length-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  padding: 4px;

  border: 1px solid var(--color-border);
  border-radius: 10px;

  background: rgba(16, 16, 28, 0.65);
}

.length-option {
  padding: 0.65rem 0.5rem;

  border-radius: 7px;

  color: var(--color-text-secondary);

  cursor: pointer;

  transition:
    background-color var(--transition-normal),
    color var(--transition-normal);
}

.length-option--selected {
  background: rgba(139, 114, 207, 0.18);
  color: var(--color-text-primary);
}

.begin-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;

  width: 100%;
  min-height: 50px;

  border: 1px solid rgba(139, 114, 207, 0.55);
  border-radius: 10px;

  background: rgba(34, 28, 57, 0.75);

  color: var(--color-text-primary);
  font-size: 0.85rem;
  letter-spacing: 0.08em;

  cursor: pointer;

  transition:
    background-color var(--transition-normal),
    border-color var(--transition-normal),
    box-shadow var(--transition-normal),
    opacity var(--transition-normal);
}

.begin-button:not(:disabled):hover {
  border-color: var(--color-accent-purple);

  background: rgba(48, 38, 80, 0.85);

  box-shadow: 0 0 25px rgba(139, 114, 207, 0.12);
}

.begin-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.loading-label {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.loading-star {
  display: inline-block;
  animation: pulse-star 1.4s ease-in-out infinite;
}

.explore-error {
  margin: var(--space-md) 0 0;

  color: var(--color-text-secondary);
  font-size: 0.8rem;
  text-align: center;
}

@keyframes pulse-star {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.topic-enter-active,
.topic-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.topic-enter-from,
.topic-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (min-width: 600px) {
  .category-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
