<template>
  <div class="register-container">
    <form @submit.prevent="handleSubmit" class="register-form">
      <h2>Регистрация</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-group">
        <label for="name">Имя</label>
        <input
            id="name"
            v-model="name"
            type="text"
            required
            placeholder="Введите ваше имя"
            :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Введите emaik"
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
            placeholder="Ввелите пароль (минимум 6 символов)"
            :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Подтверждение пароля</label>
        <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Подтвердите пароль"
            :disabled="loading"
        />
      </div>

      <div v-if="passwordError" class="field-error">
        {{ passwordError }}
      </div>

      <button
          type="submit"
          :disabled="loading || !isFormValid"
          class="submit-btn">
        {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>

      <p class="login-link">
        Уже есть аккаунт?
        <router-link to="/login">Войти</router-link>
        >
      </p>
    </form>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue';
import {useAuthStore} from '@/stores/auth'
import {useRouter} from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const name = ref('')
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const passwordError = computed(() => {
  if (password.value && password.value.length < 6) {
    return 'Пароль должен содержать минимум 6 символов';
  }
  if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
    return 'Пароли не совпадают';
  }
  return '';
});

const isFormValid = computed(() => {
  return email.value &&
      name.value &&
      password.value &&
      confirmPassword.value &&
      password.value.length >= 6 &&
      password.value === confirmPassword.value;
})

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
    });
    router.push('/');
  }catch(err) {
    error.value = err.response?.data?.detail?.[0]?.msg ||
        err.message ||
        'Ошибка регистрации';
  }finally {
    loading.value = false;
  }
};
</script>


<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form {
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

.field-error {
  color: #c00;
  font-size: 0.875rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
}

</style>