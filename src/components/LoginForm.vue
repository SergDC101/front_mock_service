<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit" class="login-form">
      <h2>Вход в систему</h2>

      <div v-if="error" class="error-message">
        {{ error }}
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

<script>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'LoginForm',
  setup() {
    const authStore = useAuthStore()
    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const error = ref('')

    const handleSubmit = async () => {
      loading.value = true
      error.value = ''

      try {
        await authStore.login({
          email: email.value,
          password: password.value
        })


      } catch (err) {
        error.value = err.response?.data?.detail || 'Ошибка входа'
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      loading,
      error,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
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

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background-color: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
}
</style>