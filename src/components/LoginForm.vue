<template>
<div class="login-container">
  <form @submit.prevent="handleSubmit" class="login-form">
    <h2>Вход в систему</h2>

    <div v-if="error" class="error-message">
      {{error}}
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="Введите email"
          :disabled="loading"
      />
    </div>

    <div class="form-group">
      <label for="password">Пароль</label>
      <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="Введите пароль"
          :disabled="loading"
      />
    </div>

    <button type="submit" :disabled="loading" class="submit-btn">
      {{ loading ? 'Вход...' : 'Войти' }}
    </button>

    <p class="register-link">
      Нет аккаунта?
      <router-link to="/register">Зарегистрироваться</router-link>
    </p>
  </form>
</div>
</template>


<script setup>
import {ref} from "vue";
import {useAuthStore, userAuthStore} from '@/stores/auth';

const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });
  } catch (err) {
    error.value = err.message || 'Ошибка входа';
  }finally {
    loading.value = false;
  }
};
</script>


<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

input:disabled {
  background-color: #f5f5f5;
}

</style>