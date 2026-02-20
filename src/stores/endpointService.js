import api from '../services/api';

class EndpointService {
    /**
     * Создание нового эндпоинта
     * POST /endpoint
     * @param {Object} data - данные для создания эндпоинта
     * @param {string} data.path - путь эндпоинта
     * @param {string} data.method - HTTP метод
     * @param {Object|string} data.jsonData - JSON данные (будут преобразованы в строку)
     * @param {string} data.groupName - название группы
     */
    async createEndpoint({ path, method, jsonData, groupName }) {
        try {
            // Преобразуем JSON данные в строку, если это объект
            const jsonDataString = typeof jsonData === 'string'
                ? jsonData
                : JSON.stringify(jsonData);

            const payload = {
                path: path,
                method: method,
                json_data: jsonDataString,
                group_name: groupName
            };

            console.log('Отправка запроса на создание эндпоинта:', {
                url: '/endpoint',
                payload
            });

            const response = await api.post('/endpoint', payload);

            console.log('Ответ сервера (создание эндпоинта):', {
                status: response.status,
                data: response.data
            });

            // Проверяем успешность запроса
            if (response.status === 200 || response.status === 201) {
                // Если сервер возвращает статус success
                if (response.data && response.data.status === 'success') {
                    return {
                        success: true,
                        data: response.data.data || response.data,
                        message: 'Эндпоинт успешно создан'
                    };
                }
                // Если сервер возвращает данные напрямую
                return {
                    success: true,
                    data: response.data,
                    message: 'Эндпоинт успешно создан'
                };
            } else {
                throw new Error(`Неожиданный статус ответа: ${response.status}`);
            }
        } catch (error) {
            console.error('Ошибка при создании эндпоинта:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Обновление эндпоинта
     * PUT /endpoint/{id}
     * @param {number} id - ID эндпоинта
     * @param {Object} data - данные для обновления
     * @param {string} data.path - путь эндпоинта
     * @param {string} data.method - HTTP метод
     * @param {Object|string} data.jsonData - JSON данные
     */
    async updateEndpoint(id, { path, method, jsonData }) {
        try {
            const jsonDataString = typeof jsonData === 'string'
                ? jsonData
                : JSON.stringify(jsonData);

            const payload = {
                path: path,
                method: method,
                json_data: jsonDataString
            };

            console.log(`Обновление эндпоинта ${id}:`, payload);

            const response = await api.put(`/endpoint/${id}`, payload);

            if (response.status === 200) {
                if (response.data && response.data.status === 'success') {
                    return {
                        success: true,
                        data: response.data.data || response.data,
                        message: 'Эндпоинт успешно обновлен'
                    };
                }
                return {
                    success: true,
                    data: response.data,
                    message: 'Эндпоинт успешно обновлен'
                };
            } else {
                throw new Error(`Неожиданный статус ответа: ${response.status}`);
            }
        } catch (error) {
            console.error(`Ошибка при обновлении эндпоинта ${id}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Удаление эндпоинта
     * DELETE /endpoint/{id}
     * @param {number} id - ID эндпоинта
     */
    async deleteEndpoint(id) {
        try {
            const response = await api.delete(`/endpoint/${id}`);

            if (response.status === 200) {
                return {
                    success: true,
                    message: 'Эндпоинт успешно удален'
                };
            } else {
                throw new Error(`Неожиданный статус ответа: ${response.status}`);
            }
        } catch (error) {
            console.error(`Ошибка при удалении эндпоинта ${id}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Получение всех эндпоинтов группы
     * GET /endpoint?group_name={groupName}
     * @param {string} groupName - название группы
     */
    async getEndpointsByGroup(groupName) {
        try {
            const response = await api.get(`/endpoint?group_name=${encodeURIComponent(groupName)}`);

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(`Неожиданный статус ответа: ${response.status}`);
            }
        } catch (error) {
            console.error(`Ошибка при получении эндпоинтов группы ${groupName}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Получение эндпоинта по ID
     * GET /endpoint/{id}
     * @param {number} id - ID эндпоинта
     */
    async getEndpoint(id) {
        try {
            const response = await api.get(`/endpoint/${id}`);

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(`Неожиданный статус ответа: ${response.status}`);
            }
        } catch (error) {
            console.error(`Ошибка при получении эндпоинта ${id}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Обработка ошибок API
     * @param {Error} error - объект ошибки
     */
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            console.error('API Error (Endpoint):', { status, data });

            switch (status) {
                case 400:
                    return new Error(data.detail || data.message || 'Некорректные данные запроса');
                case 401:
                    return new Error('Не авторизован. Пожалуйста, войдите снова');
                case 403:
                    return new Error('Доступ запрещен');
                case 404:
                    return new Error('Эндпоинт не найден');
                case 409:
                    return new Error('Эндпоинт с таким путем уже существует');
                case 422:
                    if (data.detail && Array.isArray(data.detail)) {
                        const messages = data.detail.map(err => err.msg).join(', ');
                        return new Error(messages);
                    }
                    return new Error('Ошибка валидации данных');
                case 500:
                    return new Error('Внутренняя ошибка сервера');
                default:
                    return new Error(data.detail || data.message || 'Произошла ошибка при запросе');
            }
        } else if (error.request) {
            return new Error('Сервер не отвечает. Проверьте подключение к интернету');
        } else {
            return new Error(error.message || 'Произошла неизвестная ошибка');
        }
    }
}

export default new EndpointService();