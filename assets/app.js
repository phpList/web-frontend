import { createApp } from 'vue';
import App from './vue/App.vue';

// Mount the main app if the element exists
const appElement = document.getElementById('vue-app');
if (appElement) {
    createApp(App).mount('#vue-app');
}

