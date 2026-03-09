import './styles/app.css';
import { createApp } from 'vue';
import App from './vue/App.vue';
import { router } from './router';

const appElement = document.getElementById('vue-app');

if (appElement) {
    const app = createApp(App);
    app.use(router);
    app.mount(appElement);
}

