<template>
  <div id="nav-container">
    <router-link to="/">实时快讯</router-link>
    <router-link to="/rates">资金费率查询</router-link>
  </div>

  <router-view />
</template>

<script setup>
// 这个组件现在不再需要任何逻辑了，非常干净！
</script>

<style>
/* 添加一些简单的样式，让它看起来像您想要的效果 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f8f9fa;
}

#nav-container {
  padding: 20px;
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
}

#nav-container a {
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  color: #495057;
  margin-right: 25px;
  padding-bottom: 5px;
  transition: color 0.3s ease;
}

#nav-container a:hover {
  color: #007bff;
}

/* Vue Router会自动给当前激活的链接添加这个class，我们可以用它来高亮显示 */
#nav-container a.router-link-exact-active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}

/* 给路由显示的内容区域一些边距 */
router-view {
  padding: 20px;
}
</style>