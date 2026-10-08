import { defineStore } from 'pinia'

export type Language = 'it' | 'en'

const LANGUAGE_STORAGE_KEY = 'aiterna-language'

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    language: null as Language | null,
  }),

  actions: {
    loadLanguage() {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)

      if (savedLanguage === 'it' || savedLanguage === 'en') {
        this.language = savedLanguage
      }
    },

    setLanguage(language: Language) {
      this.language = language
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    },
  },
})