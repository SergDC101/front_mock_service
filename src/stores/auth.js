import {defineStore} from 'pinia';
import api from '@/services/api';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('access_token') || null,
        loading: false,
        error: null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        currentUser: (state) => state.user,
    },

    actions: {
        async register(userData) {
            this.loading = true;
            this.error = null;

            try {
                const response = await api.post('/auth/register/', {
                    email: userData.email,
                    password: userData.password,
                });

                // После успешной регистрации можно автоматически залогинить
                await this.login({
                    email: userData.email,
                    password: userData.password,
                });
                return response.data;
            } catch (error) {
                this.error = error.response?.data?.detail || 'Ошибка регистрации';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async login(credentials) {
            this.loading = true;
            this.error = null;

            try {
                // FastAPI Users ожидает from-data для login
                const fromData = new FormData();
                formData.append('username', credentials.email);
                formData.append('password', credentials.password);

                const response = await api.post('auth/jwt/login', formData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const {access_token} = response.data;

                // Сохраняем токен
                localStorage.setItem('access_token', access_token);
                this.token = access_token;

                // Получаем информацию о пользователе
                await this.fetchUser();

                // Перенаправляем на главную
                router.push('/');

                return response.data;
            } catch(error) {
                this.error = error.response?.data?.detail || 'Неверный email или пароль';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchUser() {
            try {
                const response = await api.get('/user/me');
                this.user = response.data;
                localStorage.setItem('user', JSON.stringify(response.data));
                return response.data;
            }catch (error) {
                console.error('Ошибка получения пользователя:', error);
                this.logout();
            }
        },

        logout() {
            // Опционально: отправить запрос на логаут
            api.post('/auth/jwt/logout').catch(() => {
                // Игнорируем ошибки при логауте
            });

            // Очищаем локальное хранилище
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');

            this.user = null;
            this.token = null;

            router.push('/login');
        },

        clearError() {
            this.error = null;
        },


    },
});