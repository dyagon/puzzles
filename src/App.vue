<template>
  <div class="app">
    <header class="nav-header">
      <h1 class="title">{{ t('app.title') }}</h1>
      <nav class="nav">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <router-link to="/kami2">{{ t('nav.kami2') }}</router-link>
        <router-link to="/sudoku">{{ t('nav.sudoku') }}</router-link>
      </nav>
      <div class="lang-switch">
        <button
          type="button"
          :class="{ active: locale === 'zh' }"
          @click="changeLocale('zh')"
        >
          {{ t('lang.zh') }}
        </button>
        <button
          type="button"
          :class="{ active: locale === 'en' }"
          @click="changeLocale('en')"
        >
          {{ t('lang.en') }}
        </button>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const changeLocale = (lang: 'en' | 'zh') => {
  locale.value = lang
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('locale', lang)
  }
}
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.nav-header {
  padding: 1rem 2rem;
  background: #16213e;
  border-bottom: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  gap: 2rem;
}
.title {
  margin: 0;
  font-size: 1.25rem;
}
.nav {
  display: flex;
  gap: 1.5rem;
}
.nav a {
  color: #7eb8da;
  text-decoration: none;
}
.nav a:hover {
  text-decoration: underline;
}
.nav a.router-link-active {
  color: #fff;
  font-weight: 600;
}
.lang-switch {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}
.lang-switch button {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 999px;
  border: 1px solid #2a2a4a;
  background: transparent;
  color: #aab;
  cursor: pointer;
}
.lang-switch button.active {
  background: #4ecdc4;
  border-color: #4ecdc4;
  color: #fff;
}
.main {
  flex: 1;
}
</style>
