// Ссылка на стор (будет установлена при инициализации)
let authStore = null;

/**
 * Установка ссылки на стор авторизации
 * @param {Object} store - экземпляр authStore
 */
export const setAuthStore = (store) => {
    authStore = store;
};

/**
 * Получение имени пользователя из стора
 * @returns {string} - имя пользователя или пустая строка
 */
export const getUsername = () => {
    if (!authStore) {
        console.warn('Auth store not initialized');
        return '';
    }

    // Получаем имя из user объекта в сторе
    const user = authStore.user;
    if (!user) return '';

    // Пробуем получить имя из разных возможных полей
    return user.name || user.username || user.email?.split('@')[0] || '';
};

/**
 * Получение полного пути с именем пользователя
 * @param {string} endpoint - эндпоинт группы
 * @param {string} path - путь эндпоинта
 * @returns {string} - полный путь с именем пользователя
 */
export const getUserPath = (endpoint, path = '') => {
    const username = getUsername();

    const basePath = username ? `/${username}/${endpoint}` : `/${endpoint}`;
    if (!path) return basePath.replace(/\/+/g, '/');

    return `${basePath}/${path}`.replace(/\/+/g, '/');
};

/**
 * Получение префикса пути (имя пользователя)
 * @returns {string} - префикс пути
 */
export const getPathPrefix = () => {
    const username = getUsername();
    return username ? `/${username}/` : '/';
};

/**
 * Формирование полного URL с доменом
 * @param {string} baseUrl - базовый URL API
 * @param {string} endpoint - эндпоинт группы
 * @param {string} path - путь эндпоинта
 * @returns {string} - полный URL
 */
export const getFullUrlWithDomain = (baseUrl, endpoint, path = '') => {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const userPath = getUserPath(endpoint, path);
    return `${cleanBaseUrl}${userPath}`;
};