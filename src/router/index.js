// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import RealtimeNews from '../components/RealtimeNews.vue';
import FundingRateTable from '../components/FundingRateTable.vue';

// 1. 定义路由规则
const routes = [
  {
    path: '/', // 网站的根路径 (首页)
    name: 'News',
    component: RealtimeNews // 访问根路径时，显示 RealtimeNews 组件
  },
  {
    path: '/rates', // “资金费率”页面的路径
    name: 'Rates',
    component: FundingRateTable // 访问 /rates 时，显示 FundingRateTable 组件
  }
];

// 2. 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 3. 导出路由实例
export default router;