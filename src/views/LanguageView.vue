<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { usePreferencesStore, type Language } from '@/stores/preferences'

const router = useRouter()
const preferencesStore = usePreferencesStore()

const { locale } = useI18n()

const selectLanguage = (language: Language) => {
  preferencesStore.setLanguage(language)
  locale.value = language

  router.push('/home')
}
</script>

<template>
  <main class="language-view">
    <div class="language-view__content">
      <div class="language-view__brand">
        <h1 class="language-view__title">AIterna</h1>
        <span class="language-view__star">✦</span>
      </div>

      <p class="language-view__subtitle">
        {{ $t('language.title') }}
      </p>

      <div class="language-view__options">
        <button
          class="language-option"
          type="button"
          @click="selectLanguage('it')"
        >
          Italiano
        </button>

        <button
          class="language-option"
          type="button"
          @click="selectLanguage('en')"
        >
          English
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.language-view {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 100vh;
  padding: var(--space-xl);

  overflow: hidden;
}

.language-view::before {
  content: '';

  position: absolute;
  top: 12%;
  left: 50%;

  width: 380px;
  height: 380px;

  background: radial-gradient(
    circle,
    rgba(139, 114, 207, 0.14),
    rgba(101, 125, 204, 0.05) 40%,
    transparent 70%
  );

  transform: translateX(-50%);
  pointer-events: none;
}

.language-view__content {
  position: relative;
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center;

  width: 100%;
  max-width: 420px;

  text-align: center;
}

.language-view__brand {
  display: flex;
  flex-direction: column;
  align-items: center;

  margin-bottom: var(--space-2xl);
}

.language-view__title {
  margin: 0;

  font-family: var(--font-reading);
  font-size: clamp(2.6rem, 8vw, 4.5rem);
  font-weight: 400;
  letter-spacing: 0.04em;
}

.language-view__star {
  margin-top: var(--space-sm);

  color: var(--color-accent-purple);
  font-size: 0.9rem;

  opacity: 0.8;
}

.language-view__subtitle {
  margin: 0 0 var(--space-lg);

  color: var(--color-text-secondary);
  font-size: 0.95rem;
  letter-spacing: 0.03em;
}

.language-view__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);

  width: 100%;
}

.language-option {
  width: 100%;
  padding: 0.95rem 1.25rem;

  border: 1px solid var(--color-border);
  border-radius: 12px;

  background: rgba(16, 16, 28, 0.72);

  color: var(--color-text-primary);

  cursor: pointer;

  transition:
    border-color var(--transition-normal),
    background-color var(--transition-normal),
    transform var(--transition-fast),
    box-shadow var(--transition-normal);
}

.language-option:hover {
  border-color: rgba(139, 114, 207, 0.65);

  background: rgba(27, 24, 46, 0.85);

  box-shadow: 0 0 24px rgba(139, 114, 207, 0.1);

  transform: translateY(-2px);
}

.language-option:active {
  transform: translateY(0);
}

.language-option:focus-visible {
  outline: 2px solid var(--color-accent-purple);
  outline-offset: 3px;
}
</style>