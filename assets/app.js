import './styles/app.css';
import { createApp } from 'vue';
import App from './vue/App.vue';
import { router } from './router';
import { createAppI18n } from './vue/i18n';

const appElement = document.getElementById('vue-app');

if (appElement) {
    const app = createApp(App);
    app.use(router);
    app.use(createAppI18n());
    app.mount(appElement);
}

