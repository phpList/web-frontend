import './styles/app.css';
import { createApp } from 'vue';
import App from './vue/App.vue';
import { router } from './router';

const appElement = document.getElementById('vue-app');

if (appElement) {
    const app = createApp(App);
    app.use(router);
    app.mount('#vue-app');
}

const subscribersElement = document.getElementById('vue-subscribers');

if (subscribersElement) {
    const app = createApp(App);
    app.use(router);
    app.provide('subscribers', JSON.parse(subscribersElement.dataset.subscribers))
    app.provide('pagination', JSON.parse(subscribersElement.dataset.pagination))
    app.mount('#vue-subscribers');
}

