import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../vue/views/DashboardView.vue'
import SubscribersView from '../vue/views/SubscribersView.vue'
import ListsView from '../vue/views/ListsView.vue'
import ListSubscribersView from '../vue/views/ListSubscribersView.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
        { path: '/subscribers', name: 'subscribers', component: SubscribersView, meta: { title: 'Subscribers' } },
        { path: '/lists', name: 'lists', component: ListsView, meta: { title: 'Lists' } },
        { path: '/lists/:listId/subscribers', name: 'list-subscribers', component: ListSubscribersView, meta: { title: 'List Subscribers' } },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});

router.afterEach((to) => {
    const defaultTitle = 'phpList';
    const pageTitle = to.meta.title;
    document.title = pageTitle ? `${defaultTitle} - ${pageTitle}` : defaultTitle;
});
