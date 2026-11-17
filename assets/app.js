import './styles/app.css';
import { createApp } from 'vue';
import App from './vue/App.vue';
import { router } from './router';
import { createAppI18n, loadMessages, readLocale } from './vue/i18n';

const appElement = document.getElementById('vue-app');

if (appElement) {
    // The server renders the page in the administrator's language and states it in <html lang>.
    const locale = readLocale();

    loadMessages(locale).then((messages) => {
        const app = createApp(App);
        app.use(router);
        app.use(createAppI18n({ locale, messages }));
        app.mount(appElement);
    });
}
