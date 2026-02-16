import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:8086', // URL вашего FastAPI бэкенда
    headers: {
        'Content-Type': 'application/json',
    }
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

// Интерцептор для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка 401 и это не запрос на обновление токена
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;


            // Попытка обновить токен (если используется refresh token)
        }
        return Promise.reject(error);
    }
);


export default api;