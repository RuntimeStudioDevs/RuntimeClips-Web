// RuntimeClips-Web — Punto de Entrada Principal (Vue 3 + Pinia)

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/habbo-ui.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
