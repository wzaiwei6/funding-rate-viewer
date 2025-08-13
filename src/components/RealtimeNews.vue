<template>
  <div class="news-page-container">
    <div class="news-header">
      <h1>实时加密货币快讯</h1>
      <select v-model="selectedLanguage" class="language-select">
        <option value="zh-cn">简体中文</option>
        <option value="zh-tw">繁體中文</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
        <option value="es">Español</option>
      </select>
    </div>

    <div v-if="isLoading" class="message">正在加载最新快讯...</div>
    <div v-else-if="error" class="message error-message">{{ error }}</div>
    <div v-else-if="displayedNews.length > 0" class="news-list">
      <div v-for="item in displayedNews" :key="item.id" class="news-item">
        <div class="meta">
          <span class="author">作者: {{ item.author }}</span> |
          <span>发布于: {{ formatTimestamp(item.releaseTime) }}</span>
        </div>
        <h2>{{ item.displayTitle }}</h2>
        
        <div class="content" :class="{ collapsed: item.isCollapsed }">
          <div class="content-inner" v-html="item.displayContent"></div>
        </div>

        <button v-if="item.isLongContent" @click="toggleCollapse(item, $event)" class="toggle-btn">
          {{ item.isCollapsed ? '展开阅读' : '收起' }}
        </button>
      </div>
    </div>
    <div v-else class="message">暂无新闻数据。</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const isLoading = ref(true);
const error = ref(null);
const originalNews = ref([]);
const selectedLanguage = ref('zh-cn');
const apiKey = "SOSO-2bedc4e9d8a64962a8b1ad5f78893d48";

onMounted(() => { fetchNews(); });

// --- 【修改点 3】: 全新的 toggleCollapse 方法 ---
function toggleCollapse(item, event) {
  // 1. 正常切换数据状态
  item.isCollapsed = !item.isCollapsed;

  // 2. 获取到 .content 元素
  // event.target 是我们点击的按钮, previousElementSibling 是按钮的前一个兄弟元素，也就是 .content
  const contentElement = event.target.previousElementSibling;

  if (contentElement) {
    if (item.isCollapsed) {
      // 如果是收起状态，清除内联的 max-height 样式，让CSS类接管
      contentElement.style.maxHeight = null;
    } else {
      // 如果是展开状态
      // contentElement.scrollHeight 会返回元素内容的总高度，即使它被隐藏了
      // 我们将这个精确的高度值赋给 max-height，CSS动画就会完美执行
      contentElement.style.maxHeight = contentElement.scrollHeight + 'px';
    }
  }
}

// --- 其他JS代码保持不变 ---
async function fetchNews() {
  if (apiKey === 'YOUR_x-soso-api-key') {
    error.value = '错误：请在组件代码中填写您的 API Key。';
    isLoading.value = false;
    return;
  }
  const apiUrl = 'https://openapi.sosovalue.com/api/v1/news/featured?pageNum=1&pageSize=10&categoryList=1,2';
  try {
    const response = await fetch(apiUrl, { headers: { 'x-soso-api-key': apiKey } });
    if (!response.ok) throw new Error(`API 请求失败，状态码: ${response.status}`);
    const data = await response.json();
    if (data.code !== 0) throw new Error(`API 业务错误: ${data.msg || '未知错误'}`);
    originalNews.value = data.data.list;
  } catch (err) {
    error.value = `加载失败: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

const displayedNews = computed(() => {
  const charLimit = 200;
  return originalNews.value.map(item => {
    const contentForLang = item.multilanguageContent.find(c => c.language === selectedLanguage.value) || item.multilanguageContent.find(c => c.language === 'en');
    if (!contentForLang) {
      return { ...item, displayTitle: 'N/A', displayContent: 'N/A', isLongContent: false };
    }
    const plainText = (contentForLang.content || '').replace(/<[^>]*>/g, '');
    const isLongContent = plainText.length > charLimit;
    return {
      ...item,
      displayTitle: contentForLang.title,
      displayContent: contentForLang.content,
      isLongContent,
      isCollapsed: isLongContent
    };
  });
});
</script>

<style scoped>
/* Style部分与之前基本相同，只微调了 .content */
.news-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.news-header h1 {
  font-size: 28px;
  margin: 0;
}
.language-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #fff;
  font-size: 14px;
}
.news-list {
  display: grid;
  gap: 25px;
}
.news-item {
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.meta { font-size: 13px; color: #6c757d; margin-bottom: 15px; }
.news-item h2 { font-size: 22px; margin-top: 0; margin-bottom: 15px; }
.news-item .content {
  font-size: 16px;
  line-height: 1.7;
  color: #495057;
  /* 动画效果作用于 max-height */
  transition: max-height 0.5s ease-in-out;
  overflow: hidden; /* 必须有这个才能隐藏超出部分 */
}
.message { text-align: center; font-size: 18px; color: #777; padding: 40px; }
.error-message { color: red; }

/* .collapsible 类不再需要，但保留 .collapsed 用于设定初始状态 */
.content.collapsed {
  max-height: 120px;
  position: relative; /* 用于 ::after 定位 */
}
.content.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(to bottom, transparent, white);
  pointer-events: none; /* 确保蒙版不会干扰点击 */
}
.toggle-btn { background: none; border: none; color: #007bff; cursor: pointer; font-weight: bold; padding: 8px 0; margin-top: 10px; }


/* 解决横向滚动问题的关键CSS (保留) */
.content :deep(.content-inner *) {
  max-width: 100% !important;
  word-break: break-all;
  white-space: normal !important;
}
</style>