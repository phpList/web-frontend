import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../vue/views/DashboardView.vue'
import SubscribersView from '../vue/views/SubscribersView.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/dashboard', name: 'dashboard', component: DashboardView },
        { path: '/subscribers', name: 'subscribers', component: SubscribersView },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});
