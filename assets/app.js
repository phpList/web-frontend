import { createApp } from 'vue';
import App from './vue/App.vue';
import MyWidget from './vue/MyWidget.vue';

// Mount the main app if the element exists
const appElement = document.getElementById('vue-app');
if (appElement) {
    createApp(App).mount('#vue-app');
}

// Mount the widget if the element exists
const widgetElement = document.getElementById('my-widget');
if (widgetElement) {
    createApp(MyWidget).mount('#my-widget');
}
