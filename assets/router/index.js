import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../vue/DashboardView.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'dashboard', component: DashboardView },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});
