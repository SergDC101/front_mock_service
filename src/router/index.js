import {createRouter, createWebHistory} from 'vue-router';
import {useAuthStore} from "@/stores/auth";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/HomeView.vue'),
            meta: {requiresAuth: true},
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/components/LoginForm.vue'),
            meta: {guest: true},
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/components/RegisterForm.vue'),
            meta: {guest: true},
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('@/views/ProfileView.vue'),
            meta: {requiresAuth: true},
        },
    ]
});

// Навигационный гард
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated();

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    }else if (to.meta.guest && isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router;