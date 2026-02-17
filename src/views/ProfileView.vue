<template>
  <div class="profile">
    <h1>Профиль пользователя</h1>

    <div v-if="user" class="user-info">
      <div class="info-item">
        <strong>ID:</strong> {{ user.id }}
      </div>
      <div class="info-item">
        <strong>Email:</strong> {{ user.email }}
      </div>
      <div class="info-item">
        <strong>Активен:</strong> {{ user.is_active ? 'Да' : 'Нет' }}
      </div>
      <div class="info-item">
        <strong>Суперпользователь:</strong> {{ user.is_superuser ? 'Да' : 'Нет' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
</script>

<style scoped>
.profile {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
}

.user-info {
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
}

.info-item {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
}

.info-item:last-child {
  border-bottom: none;
}

strong {
  color: #667eea;
  margin-right: 0.5rem;
}
</style>