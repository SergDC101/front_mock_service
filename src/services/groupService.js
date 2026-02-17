// Мок-данные для групп
const mockGroups = [
    {
        id: 1,
        name: 'Пользовательский API',
        description: 'Группа для работы с пользователями',
        endpoint: 'users-api',
        isActive: true,
        endpoints: [
            { id: 1, name: 'GET /users', method: 'GET', path: 'users', jsonData: {} },
            { id: 2, name: 'POST /users', method: 'POST', path: 'users', jsonData: {} },
            { id: 3, name: 'GET /users/{id}', method: 'GET', path: 'users/{id}', jsonData: {} },
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-02-01T14:20:00Z'
    },
    {
        id: 2,
        name: 'Аутентификация',
        description: 'Эндпоинты для входа и регистрации',
        endpoint: 'auth-api',
        isActive: true,
        endpoints: [
            { id: 4, name: 'POST /auth/login', method: 'POST', path: 'auth/login', jsonData: {} },
            { id: 5, name: 'POST /auth/register', method: 'POST', path: 'auth/register', jsonData: {} },
            { id: 6, name: 'POST /auth/logout', method: 'POST', path: 'auth/logout', jsonData: {} },
            { id: 7, name: 'POST /auth/refresh', method: 'POST', path: 'auth/refresh', jsonData: {} },
        ],
        createdAt: '2024-01-20T09:15:00Z',
        updatedAt: '2024-02-05T11:30:00Z'
    },
    {
        id: 3,
        name: 'Продукты',
        description: 'Управление каталогом продуктов',
        endpoint: 'products-api', // Новое поле
        isActive: false,
        endpoints: [
            { id: 8, name: 'GET /products', method: 'GET', path: '/products', jsonData: {}  },
            { id: 9, name: 'GET /products/{id}', method: 'GET', path: '/products/{id}' , jsonData: {} },
        ],
        createdAt: '2024-01-25T16:45:00Z',
        updatedAt: '2024-01-30T08:10:00Z'
    },
    {
        id: 4,
        name: 'Заказы',
        description: 'Управление заказами',
        endpoint: 'orders-api', // Новое поле
        isActive: true,
        endpoints: [
            { id: 10, name: 'GET /orders', method: 'GET', path: '/orders', jsonData: {}  },
            { id: 11, name: 'POST /orders', method: 'POST', path: '/orders' , jsonData: {} },
            { id: 12, name: 'PUT /orders/{id}', method: 'PUT', path: '/orders/{id}', jsonData: {}  },
            { id: 13, name: 'DELETE /orders/{id}', method: 'DELETE', path: '/orders/{id}', jsonData: {}  },
            { id: 14, name: 'GET /orders/{id}/items', method: 'GET', path: '/orders/{id}/items' , jsonData: {} },
        ],
        createdAt: '2024-02-01T12:00:00Z',
        updatedAt: '2024-02-10T09:45:00Z'
    },
    {
        id: 5,
        name: 'Платежи',
        description: 'Обработка платежей и транзакций',
        endpoint: 'payments-api', // Новое поле
        isActive: false,
        endpoints: [
            { id: 15, name: 'POST /payments', method: 'POST', path: '/payments', jsonData: {}  },
            { id: 16, name: 'GET /payments/{id}', method: 'GET', path: '/payments/{id}', jsonData: {}  },
        ],
        createdAt: '2024-02-05T14:20:00Z',
        updatedAt: '2024-02-07T10:30:00Z'
    }
];

// Имитация задержки сети
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class GroupService {
    async getGroups() {
        // Имитируем запрос к API
        await delay(800);
        return [...mockGroups];
    }

    async getGroup(id) {
        await delay(500);
        const group = mockGroups.find(g => g.id === id);
        if (!group) {
            throw new Error('Группа не найдена');
        }
        return { ...group };
    }

    async createGroup(groupData) {
        await delay(1000);
        const newGroup = {
            id: Math.max(...mockGroups.map(g => g.id)) + 1,
            ...groupData,
            endpoints: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        mockGroups.push(newGroup);
        return { ...newGroup };
    }

    async updateGroup(id, groupData) {
        await delay(800);
        const index = mockGroups.findIndex(g => g.id === id);
        if (index === -1) {
            throw new Error('Группа не найдена');
        }
        mockGroups[index] = {
            ...mockGroups[index],
            ...groupData,
            updatedAt: new Date().toISOString()
        };
        return { ...mockGroups[index] };
    }

    async deleteGroup(id) {
        await delay(600);
        const index = mockGroups.findIndex(g => g.id === id);
        if (index === -1) {
            throw new Error('Группа не найдена');
        }
        mockGroups.splice(index, 1);
        return { success: true };
    }

    async toggleGroupStatus(id) {
        await delay(400);
        const index = mockGroups.findIndex(g => g.id === id);
        if (index === -1) {
            throw new Error('Группа не найдена');
        }
        mockGroups[index].isActive = !mockGroups[index].isActive;
        mockGroups[index].updatedAt = new Date().toISOString();
        return { ...mockGroups[index] };
    }
}

export default new GroupService();