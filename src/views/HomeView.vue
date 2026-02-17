<template>
  <div class="home">
    <h1>Добро пожаловать, {{ authStore.user?.email }}!</h1>
    <p>Вы успешно авторизовались через Bearer token.</p>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
}
</style>