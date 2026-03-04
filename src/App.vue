<template>
  <div class="app">
    <header class="nav-header">
      <h1 class="title">Puzzles</h1>
      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link to="/kami2">Kami2</router-link>
        <router-link to="/sudoku">数独</router-link>
      </nav>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
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
.main {
  flex: 1;
}
</style>
