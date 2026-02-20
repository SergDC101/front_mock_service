import api from '../services/api';

class GroupService {
    /**
     * Получение всех групп пользователя
     * GET /group
     */
    async getGroups() {
        try {
            const response = await api.get('/group');
            console.log('Сырые данные с сервера (группы):', response.data);

            // Проверяем статус ответа
            if (response.status === 200) {
                // Сервер возвращает массив групп напрямую
                const groups = response.data;

                // Преобразуем поля сервера в поля для фронтенда
                const adaptedGroups = groups.map(group => ({
                    id: group.id,
                    name: group.name,
                    endpoint: group.endpoint,
                    description: group.description || '',
                    isActive: group.active, // active → isActive
                    createdAt: group.created_at, // created_at → createdAt
                    updatedAt: group.updated_at, // updated_at → updatedAt
                    endpoints: [] // По умолчанию пустой массив
                }));

                console.log('Адаптированные группы для фронтенда:', adaptedGroups);
                return adaptedGroups;
            } else {
                throw new Error('Неожиданный статус ответа');
            }
        } catch (error) {
            console.error('Ошибка при получении групп:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Получение информации о конкретной группе
     * GET /group/{id}?group_id=1
     * @param {number} id - ID группы
     */
    async getGroup(id) {
        try {
            const response = await api.get(`/group/${id}?group_id=${id}`);
            console.log(`Сырые данные с сервера (группа ${id}):`, response.data);

            if (response.status === 200) {
                const group = response.data;

                // Преобразуем поля сервера в поля для фронтенда
                const adaptedGroup = {
                    id: group.id,
                    name: group.name,
                    endpoint: group.endpoint,
                    description: group.description || '',
                    isActive: group.active,
                    createdAt: group.created_at,
                    updatedAt: group.updated_at,
                    // Сервер возвращает data, а не endpoints
                    endpoints: Array.isArray(group.data) ? group.data.map(endpoint => ({
                        id: endpoint.id,
                        name: endpoint.name || `${endpoint.method || 'GET'} ${endpoint.path || ''}`,
                        method: endpoint.method || 'GET',
                        path: endpoint.path || '',
                        description: endpoint.description || '',
                        jsonData: endpoint.json_data || endpoint.jsonData || {},
                        createdAt: endpoint.created_at || endpoint.createdAt,
                        updatedAt: endpoint.updated_at || endpoint.updatedAt
                    })) : []
                };

                console.log('Адаптированная группа для фронтенда:', adaptedGroup);
                return adaptedGroup;
            } else {
                throw new Error('Неожиданный статус ответа');
            }
        } catch (error) {
            console.error(`Ошибка при получении группы с ID ${id}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Создание новой группы
     * POST /group
     * @param {Object} groupData - данные группы
     */
    async createGroup(groupData) {
        try {
            const payload = {
                name: groupData.name,
                endpoint: groupData.endpoint,
                active: groupData.isActive,
                description: groupData.description || ''
            };

            console.log('Отправка данных на сервер (создание):', payload);

            const response = await api.post('/group', payload);
            console.log('Ответ сервера (создание):', response.data);
            console.log('Статус ответа:', response.status);

            // Проверяем успешность запроса
            if (response.status === 200) {
                // Проверяем наличие статуса "success" в ответе
                if (response.data && response.data.status === 'success') {
                    console.log('Группа успешно создана');

                    // Если в ответе есть данные группы, возвращаем их
                    if (response.data.data) {
                        const group = response.data.data;
                        return {
                            id: group.id,
                            name: group.name,
                            endpoint: group.endpoint,
                            description: group.description || '',
                            isActive: group.active,
                            createdAt: group.created_at,
                            updatedAt: group.updated_at,
                            endpoints: []
                        };
                    } else {
                        // Если данных нет, возвращаем успешный статус
                        return { success: true, status: 'success' };
                    }
                } else {
                    // Если нет статуса success, но статус 200, возможно сервер возвращает данные напрямую
                    const group = response.data;
                    return {
                        id: group.id,
                        name: group.name,
                        endpoint: group.endpoint,
                        description: group.description || '',
                        isActive: group.active,
                        createdAt: group.created_at,
                        updatedAt: group.updated_at,
                        endpoints: []
                    };
                }
            } else {
                throw new Error('Неожиданный статус ответа');
            }
        } catch (error) {
            console.error('Ошибка при создании группы:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Обновление группы
     * PUT /group/{id}
     * @param {number} id - ID группы
     * @param {Object} groupData - данные для обновления
     */
    async updateGroup(id, groupData) {
        try {
            const payload = {
                name: groupData.name,
                active: groupData.isActive,
                description: groupData.description || ''
            };

            console.log(`Отправка данных на сервер (обновление группы ${id}):`, payload);

            const response = await api.put(`/group/id?group_id=${id}`, payload);
            console.log('Ответ сервера (обновление):', response.data);
            console.log('Статус ответа:', response.status);

            if (response.status === 200) {
                if (response.data && response.data.status === 'success') {
                    console.log('Группа успешно обновлена');

                    if (response.data.data) {
                        const group = response.data.data;
                        return {
                            id: group.id,
                            name: group.name,
                            endpoint: group.endpoint,
                            description: group.description || '',
                            isActive: group.active,
                            createdAt: group.created_at,
                            updatedAt: group.updated_at,
                            endpoints: []
                        };
                    } else {
                        return { success: true, status: 'success' };
                    }
                } else {
                    const group = response.data;
                    return {
                        id: group.id,
                        name: group.name,
                        endpoint: group.endpoint,
                        description: group.description || '',
                        isActive: group.active,
                        createdAt: group.created_at,
                        updatedAt: group.updated_at,
                        endpoints: []
                    };
                }
            } else {
                throw new Error('Неожиданный статус ответа');
            }
        } catch (error) {
            console.error(`Ошибка при обновлении группы с ID ${id}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Удаление группы
     * DELETE /group/{id}
     * @param {number} id - ID группы
     */
    async deleteGroup(id) {
        try {
            const response = await api.delete(`/group/id?group_id=${id}`);
            console.log(`Группа ${id} удалена:`, response.data);
            console.log('Статус ответа:', response.status);

            if (response.status === 200) {
                if (response.data && response.data.status === 'success') {
                    return { success: true, status: 'success' };
                } else {
                    return response.data;
                }
            } else {
                throw new Error('Неожиданный статус ответа');
            }
        } catch (error) {
            console.error(`Ошибка при удалении группы с ID ${id}:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Изменение статуса активности группы
     * @param {number} id - ID группы
     * @param {boolean} active - новый статус
     */
    async toggleGroupStatus(id, active) {
        try {
            return await this.updateGroup(id, { isActive: active });
        } catch (error) {
            console.error(`Ошибка при изменении статуса группы с ID ${id}:`, error);
            throw error;
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

            console.error('API Error:', { status, data });

            switch (status) {
                case 400:
                    return new Error(data.detail || 'Некорректные данные запроса');
                case 401:
                    return new Error('Не авторизован. Пожалуйста, войдите снова');
                case 403:
                    return new Error('Доступ запрещен');
                case 404:
                    return new Error('Группа не найдена');
                case 409:
                    return new Error('Группа с таким эндпоинтом уже существует');
                case 422:
                    if (data.detail && Array.isArray(data.detail)) {
                        const messages = data.detail.map(err => err.msg).join(', ');
                        return new Error(messages);
                    }
                    return new Error('Ошибка валидации данных');
                case 500:
                    return new Error('Внутренняя ошибка сервера');
                default:
                    return new Error(data.detail || 'Произошла ошибка при запросе');
            }
        } else if (error.request) {
            return new Error('Сервер не отвечает. Проверьте подключение к интернету');
        } else {
            return new Error(error.message || 'Произошла неизвестная ошибка');
        }
    }
}

export default new GroupService();