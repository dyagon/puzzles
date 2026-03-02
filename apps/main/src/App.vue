<template>
  <div class="page">
    <h1>Puzzles</h1>
    <ul class="nav">
      <li v-for="item in links" :key="item.href">
        <a :href="item.href">{{ item.name }}</a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const links = [
  { name: 'Kami2', href: '/kami2/' },
  { name: 'Sudoku', href: '/sudoku/' },
]
</script>

<style scoped>
.page {
  padding: 2rem;
}
h1 {
  margin: 0 0 1rem;
}
.nav {
  list-style: none;
  padding: 0;
  margin: 0;
}
.nav li {
  margin: 0.5rem 0;
}
.nav a {
  color: #7eb8da;
  text-decoration: none;
}
.nav a:hover {
  text-decoration: underline;
}
</style>
