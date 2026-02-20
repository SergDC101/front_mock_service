import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import { setAuthStore } from './utils/userHelper';

// Создаем экземпляр Pinia
const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Инициализируем authStore и передаем его в хелпер
const authStore = useAuthStore();
setAuthStore(authStore);

app.mount('#app');