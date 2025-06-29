import { createApp } from 'vue';
import router from './router/index.ts';
import './style.css';
import App from './App.vue';

import ElementPlus from '../core/element-plus.full.js'
import '../core/element-plus.css'

// import { createPinia } from 'pinia';

const app = createApp(App);
app.use(ElementPlus);
app.use(router);
// app.use(createPinia());
app.mount('#app');
