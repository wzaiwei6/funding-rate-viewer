<template>
  <div class="app-container" :class="theme">
    <header class="app-header">
      <button @click="toggleTheme" class="theme-toggle">
        {{ theme === 'light' ? '🌙' : '☀️' }}
      </button>
      <h1>资金费率套利查询</h1>
      <p>实时监控各大交易所合约资金费率，发现套利机会</p>
    </header>

    <main class="content-area">
      <div class="tabs">
        <button :class="{ active: activeTab === 'positive' }" @click="activeTab = 'positive'">
          正向套利
        </button>
        <button :class="{ active: activeTab === 'negative' }" @click="activeTab = 'negative'">
          反向套利
        </button>
      </div>
      <div v-if="isLoading && paginatedData.length === 0" class="loading-placeholder">Loading...</div>
      <table v-else :class="{ reloading: isLoading }">
        <thead>
          <tr>
            <th>交易所</th>
            <th>交易对</th>
            <th>资金费率</th>
            <th>年化率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedData" :key="item.exchange + item.symbol">
            <td class="exchange-cell">
              <img v-if="item.logo" :src="item.logo" :alt="item.exchange" class="exchange-logo" />
              <span v-else class="exchange-text">{{ item.exchange }}</span>
            </td>
            <td>
              <div class="symbol-info">
                <span class="action-sell">卖</span>
                <span class="symbol-name">{{ item.symbol }}</span>
                <span class="perp-tag">Perp</span>
              </div>
              <div class="symbol-info">
                <span class="action-buy">买</span>
                <span class="symbol-name">{{ getSpotPair(item.symbol) }}</span>
              </div>
            </td>
            <td>{{ item.rate }}</td>
            <td>{{ item.annualizedRate }}</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination-controls">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';

// --- ✨ 2. Theme Management Logic ---
const theme = ref('light');

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  // Save preference to browser's local storage
  localStorage.setItem('funding-rate-theme', theme.value);
};

// --- State Management & API Endpoints (unchanged) ---
const positiveRates = ref([]);
const negativeRates = ref([]);
const isLoading = ref(true);
const activeTab = ref('positive');
const currentPage = ref(1);
const itemsPerPage = ref(20);

const apiEndpoints = [
  { name: 'Binance', url: 'https://fapi.binance.com/fapi/v1/premiumIndex' },
  { name: 'OKX', url: 'https://www.okx.com/api/v5/public/funding-rate?instType=SWAP' },
  { name: 'Bitget', url: 'https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES' }
];

const exchangeLogos = {
  Binance: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png',
  OKX: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png'
};

// --- Computed Properties & Watcher (unchanged) ---
const displayedData = computed(() => (activeTab.value === 'positive' ? positiveRates.value : negativeRates.value));
const totalPages = computed(() => Math.ceil(displayedData.value.length / itemsPerPage.value));
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  return displayedData.value.slice(startIndex, startIndex + itemsPerPage.value);
});
watch(activeTab, () => { currentPage.value = 1; });

// --- Utility & Pagination Methods (unchanged) ---
const getSpotPair = (perpSymbol) => {
  if (perpSymbol.includes('-USDT-SWAP')) return `${perpSymbol.replace('-USDT-SWAP', '')}/USDT`;
  if (perpSymbol.endsWith('USDT')) return `${perpSymbol.slice(0, -4)}/USDT`;
  return perpSymbol;
};
const getExchangeLogo = (exchangeName) => exchangeLogos[exchangeName] || '';
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

// --- Data Fetching Logic (unchanged) ---
const fetchData = async () => {
  try {
    isLoading.value = true;
    const promises = apiEndpoints.map(api => axios.get(api.url));
    const responses = await Promise.allSettled(promises);
    const allRates = [];
    responses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const exchangeName = apiEndpoints[index].name;
        const responseData = result.value.data;
        const processItem = (item, symbolField, rateField) => {
          const symbol = item[symbolField];
          const rateValue = item[rateField];
          if (symbol && rateValue) {
            const rate = parseFloat(rateValue) * 100;
            allRates.push({
              exchange: exchangeName, symbol: symbol, rate: rate.toFixed(4) + '%',
              annualizedRate: (Math.abs(rate) * 3 * 365).toFixed(2) + '%', _rate: rate,
              logo: getExchangeLogo(exchangeName) 
            });
          }
        };
        if (exchangeName === 'Binance') {
          responseData.forEach(item => processItem(item, 'symbol', 'lastFundingRate'));
        } else if (exchangeName === 'OKX') {
          responseData.data?.forEach(item => processItem(item, 'instId', 'fundingRate'));
        } else if (exchangeName === 'Bitget') {
          responseData.data?.forEach(item => processItem(item, 'symbol', 'fundingRate'));
        }
      } else { console.error(`Failed to fetch data from ${apiEndpoints[index].name}:`, result.reason); }
    });
    positiveRates.value = allRates.filter(item => item._rate >= 0).sort((a, b) => b._rate - a._rate);
    negativeRates.value = allRates.filter(item => item._rate < 0).sort((a, b) => a._rate - b._rate);
  } catch (error) { console.error("An error occurred during data processing:", error); } 
  finally { isLoading.value = false; }
};

// --- Lifecycle Hook ---
onMounted(() => {
  // ✨ Check for saved theme preference when the app loads
  const savedTheme = localStorage.getItem('funding-rate-theme');
  const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    theme.value = savedTheme;
  } else if (userPrefersDark) {
    theme.value = 'dark';
  }

  fetchData();
  setInterval(fetchData, 30000);
});
</script>

<style scoped>
/* ✨ 3. Added styles for dark mode and the toggle button */
.app-container {
  max-width: 900px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  /* Default light mode colors */
  background-color: #fff;
  color: #333;
  min-height: 100vh;
}
.app-header {
  position: relative; /* Needed for absolute positioning of the button */
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
}
.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.5rem;
}
/* ... Other styles remain the same ... */
.app-header h1 { font-size: 1.8rem; margin: 0; }
.app-header p { font-size: 1rem; color: #666; margin-top: 0.25rem; }
.content-area { padding: 0 1rem; }
.tabs { display: flex; }
.tabs button { padding: 10px 20px; border: 1px solid #ddd; border-bottom: none; background-color: #f9f9f9; cursor: pointer; font-size: 16px; color: #555; margin-right: 5px; border-radius: 5px 5px 0 0; }
.tabs button.active { background-color: #fff; border-color: #ddd; border-bottom: 1px solid #fff; position: relative; top: 1px; color: #007bff; font-weight: bold; }
.loading-placeholder { text-align: center; padding: 4rem; color: #888; }
table { width: 100%; border-collapse: collapse; transition: opacity 0.3s ease; border: 1px solid #ddd; }
table.reloading { opacity: 0.5; }
th, td { padding: 12px 10px; text-align: left; vertical-align: middle; border-bottom: 1px solid #eee; }
th { color: #888; font-weight: normal; border-bottom: 2px solid #ddd; }
tbody tr:last-child td { border-bottom: none; }
.exchange-cell { display: flex; align-items: center; height: 100%; }
.exchange-logo { width: 24px; height: 24px; vertical-align: middle; }
.exchange-text { font-size: 14px; font-weight: bold; color: #555; padding-left: 4px; }
.symbol-info { display: flex; align-items: center; font-size: 14px; padding: 2px 0; }
.action-sell, .action-buy { font-size: 12px; padding: 2px 4px; border-radius: 3px; margin-right: 8px; color: white; }
.action-sell { background-color: #ef5350; }
.action-buy { background-color: #26a69a; }
.symbol-name { font-weight: bold; }
.perp-tag { font-size: 10px; background-color: #f0f0f0; color: #888; padding: 2px 4px; border-radius: 3px; margin-left: 6px; }
td:nth-child(3) { font-weight: bold; font-size: 16px; }
td:nth-child(4) { color: #888; }
.pagination-controls { display: flex; justify-content: center; align-items: center; padding: 20px 0; }
.pagination-controls button { background-color: #007bff; color: white; border: none; padding: 8px 16px; margin: 0 10px; border-radius: 4px; cursor: pointer; }
.pagination-controls button:disabled { background-color: #ccc; cursor: not-allowed; }

/* --- Dark Mode Styles --- */
.dark {
  background-color: #1a1a1a;
  color: #e0e0e0;
}
.dark .app-header p,
.dark th,
.dark td:nth-child(4) {
  color: #888;
}
.dark .theme-toggle,
.dark .tabs button,
.dark table {
  border-color: #333;
}
.dark .tabs button {
  background-color: #222;
  color: #ccc;
}
.dark .tabs button.active {
  background-color: #1a1a1a;
  border-bottom-color: #1a1a1a;
  color: #58a6ff;
}
.dark th, .dark td {
  border-bottom-color: #333;
}
.dark .exchange-text {
  color: #ccc;
}
.dark .perp-tag {
  background-color: #333;
  color: #aaa;
}
.dark .pagination-controls button {
  background-color: #58a6ff;
}
.dark .pagination-controls button:disabled {
  background-color: #444;
  color: #888;
}
.dark .exchange-logo {
  filter: invert(0.15) brightness(1.5); /* A simple filter to make logos look better on dark backgrounds */
}
</style>