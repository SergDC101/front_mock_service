import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Импортируем компоненты
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import HomeView from '@/views/HomeView.vue'
import ProfileView from '@/views/ProfileView.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'login',
        component: LoginForm,
        meta: { guest: true }
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterForm,
        meta: { guest: true }
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView,
        meta: { requiresAuth: true }
    },
    {
        path: '/groups/:id',
        name: 'group-detail',
        component: () => import('@/views/GroupDetailView.vue'),
        meta: { requiresAuth: true },
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Навигационный гард
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated

    console.log('Navigation guard:', { to: to.path, isAuthenticated }) // Для отладки

    if (to.meta.requiresAuth && !isAuthenticated) {
        // Если маршрут требует авторизации, а пользователь не авторизован
        next('/login')
    } else if (to.meta.guest && isAuthenticated) {
        // Если маршрут только для гостей, а пользователь авторизован
        next('/')
    } else {
        // В остальных случаях пропускаем
        next()
    }
})

export default router