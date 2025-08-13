// src/main.js

import { createApp } from 'vue'
import App from './App.vue'

// --- 以下是需要您添加/修改的部分 ---

// 1. 导入我们创建的路由
import router from './router'

const app = createApp(App)

// 2. 让应用使用路由
app.use(router)

// --- 修改结束 ---

app.mount('#app')