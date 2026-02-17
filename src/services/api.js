import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8086', // Убедитесь, что порт правильный
    headers: {
        'Content-Type': 'application/json'
    }
})

// Интерцептор для добавления токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Интерцептор для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Токен истек или недействителен
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')

            // Перенаправляем на страницу логина
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api