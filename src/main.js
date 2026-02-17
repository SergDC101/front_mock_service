import { createApp } from 'vue';
import {createPinia} from 'pinia';
import App from './App.vue';
import router from './router';

// import './assets/main.css'

// Создаем экземпляр Pinia
const pinia = createPinia();

const app = createApp(App);


app.use(pinia);
app.use(router);

app.mount('#app');
// createApp(App).mount('#app')
