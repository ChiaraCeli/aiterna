<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { usePreferencesStore } from '@/stores/preferences'

const preferencesStore = usePreferencesStore()
const { locale } = useI18n()

preferencesStore.loadLanguage()

if (preferencesStore.language) {
  locale.value = preferencesStore.language
}
</script>

<template>
  <RouterView />
</template>