<script lang="ts" setup>
import type {
  AnalysisOverviewItem,
  AnalysisTrendItem,
} from '#/api/core/analytics';

import type { StatCardItem } from './MyAnalysisOverview.vue';

import { computed, onMounted, ref } from 'vue';

import { ElButton } from 'element-plus';

import { getStatistics, getTrendData } from '#/api/core/analytics';

import AnalyticsTrends from './analytics-trends.vue';
import MyAnalysisOverview from './MyAnalysisOverview.vue';

interface RequestErrorState {
  forbidden: boolean;
  message: string;
}

const TODAY_TITLES = ['访问用户', '新增用户', '新增注册'];
const MONTH_TITLES = ['累计访问人次', '新增用户', '新增注册'];

const overviewItems = ref<AnalysisOverviewItem[]>([]);
const trendData = ref<AnalysisTrendItem[]>([]);

const statisticsLoading = ref(true);
const statisticsError = ref<null | RequestErrorState>(null);
const trendLoading = ref(true);
const trendError = ref<null | RequestErrorState>(null);

function toCardItems(
  source: AnalysisOverviewItem[],
  startIndex: number,
  titles: string[],
): StatCardItem[] {
  return source
    .slice(startIndex, startIndex + titles.length)
    .map((item, index) => ({
      ...item,
      title: titles[index] ?? item.title,
    }));
}

const todayStats = computed(() =>
  toCardItems(overviewItems.value, 0, TODAY_TITLES),
);
const monthStats = computed(() =>
  toCardItems(overviewItems.value, 3, MONTH_TITLES),
);

function resolveRequestError(
  error: unknown,
  fallback: string,
  forbidden: string,
): RequestErrorState {
  const requestError = error as {
    code?: number | string;
    response?: { status?: number };
  };
  const status = Number(
    requestError?.response?.status ?? requestError?.code ?? Number.NaN,
  );
  const isForbidden = status === 403;

  return {
    forbidden: isForbidden,
    message: isForbidden ? forbidden : fallback,
  };
}

async function loadStatistics() {
  statisticsLoading.value = true;
  statisticsError.value = null;

  try {
    const data = await getStatistics();
    overviewItems.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('获取首页统计数据失败:', error);
    overviewItems.value = [];
    statisticsError.value = resolveRequestError(
      error,
      '统计数据加载失败',
      '暂无权限查看统计数据',
    );
  } finally {
    statisticsLoading.value = false;
  }
}

async function loadTrend() {
  trendLoading.value = true;
  trendError.value = null;

  try {
    const data = await getTrendData();
    trendData.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('获取首页趋势数据失败:', error);
    trendData.value = [];
    trendError.value = resolveRequestError(
      error,
      '趋势数据加载失败',
      '暂无权限查看趋势数据',
    );
  } finally {
    trendLoading.value = false;
  }
}

onMounted(() => {
  void loadStatistics();
  void loadTrend();
});
</script>

<template>
  <div class="pcr-page dashboard-page">
    <header class="dashboard-header">
      <div class="dashboard-header__main">
        <span class="pcr-kicker">OPERATIONS OVERVIEW</span>
        <h1 class="pcr-page-title">数据总览</h1>
      </div>
      <p class="dashboard-header__description">
        查看用户访问、新增与注册的今日及本月表现。
      </p>
    </header>

    <section class="statistics-section" aria-label="运营概览">
      <div v-if="statisticsError" class="state-panel" role="alert">
        <div class="state-panel__copy">
          <strong>{{ statisticsError.message }}</strong>
          <span v-if="!statisticsError.forbidden">
            请稍后重试，或使用顶部刷新按钮。
          </span>
        </div>
        <ElButton
          v-if="!statisticsError.forbidden"
          plain
          size="small"
          @click="loadStatistics"
        >
          重新加载
        </ElButton>
      </div>

      <div
        v-else-if="!statisticsLoading && overviewItems.length === 0"
        class="state-panel"
        role="status"
      >
        <div class="state-panel__copy">
          <strong>暂无统计数据</strong>
          <span>当前时间段还没有可展示的运营数据。</span>
        </div>
      </div>

      <template v-else>
        <MyAnalysisOverview
          :items="todayStats"
          :loading="statisticsLoading"
          period="today"
        />
        <MyAnalysisOverview
          v-if="statisticsLoading || monthStats.length > 0"
          :items="monthStats"
          :loading="statisticsLoading"
          period="month"
        />
      </template>
    </section>

    <section class="pcr-surface trend-panel" aria-labelledby="trend-title">
      <div class="section-heading">
        <div class="section-heading__title">
          <h2 id="trend-title" class="pcr-section-title">近 12 个月趋势</h2>
          <p class="section-heading__description">
            访问人次、新增用户与新增注册的月度变化
          </p>
        </div>
        <p class="section-heading__note">
          口径：访问按用户+日期去重；新增含游客；本月对比上月同期；趋势含本月至今。
        </p>
      </div>

      <div class="trend-body">
        <div
          v-if="trendError"
          class="state-panel state-panel--inside"
          role="alert"
        >
          <div class="state-panel__copy">
            <strong>{{ trendError.message }}</strong>
            <span v-if="!trendError.forbidden">
              请稍后重试，或使用顶部刷新按钮。
            </span>
          </div>
          <ElButton
            v-if="!trendError.forbidden"
            plain
            size="small"
            @click="loadTrend"
          >
            重新加载
          </ElButton>
        </div>

        <div v-else-if="trendLoading" class="chart-skeleton" role="status">
          <span>正在加载趋势数据…</span>
        </div>

        <div
          v-else-if="trendData.length === 0"
          class="state-panel state-panel--inside"
          role="status"
        >
          <div class="state-panel__copy">
            <strong>暂无趋势数据</strong>
            <span>最近 12 个月还没有可展示的数据。</span>
          </div>
        </div>

        <AnalyticsTrends v-else :data="trendData" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-page {
  gap: 14px;
  height: 100%;
  min-height: 0;
  max-width: 100%;
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--pcr-space-4);
  min-width: 0;
}

.dashboard-header__main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dashboard-header .pcr-page-title {
  font-size: 22px;
  line-height: 1.2;
}

.dashboard-header__description {
  margin: 0;
  max-width: 430px;
  font-size: var(--pcr-font-size-caption);
  line-height: 1.5;
  color: var(--pcr-text-secondary);
  text-align: right;
}

.statistics-section {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}

.statistics-section > .state-panel {
  grid-column: 1 / -1;
}

.trend-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 16px 20px 18px;
  overflow: hidden;
}

.section-heading {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--pcr-space-4);
  margin-bottom: 10px;
}

.section-heading__title {
  min-width: 0;
}

.section-heading__description {
  margin: 1px 0 0;
  font-size: var(--pcr-font-size-caption);
  line-height: 1.5;
  color: var(--pcr-text-muted);
}

.section-heading__note {
  flex: 0 1 500px;
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--pcr-text-muted);
  text-align: right;
}

.trend-body {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.trend-body > .state-panel,
.trend-body > .chart-skeleton {
  flex: 1 1 auto;
}

.state-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pcr-space-4);
  min-width: 0;
  padding: 14px 16px;
  background: var(--pcr-bg-surface);
  border: var(--pcr-border-width) solid var(--pcr-border);
  border-radius: var(--pcr-radius-lg);
}

.state-panel--inside {
  background: var(--pcr-bg-subtle);
}

.state-panel__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.state-panel__copy strong {
  font-size: var(--pcr-font-size-body);
  font-weight: var(--pcr-font-weight-semibold);
  line-height: var(--pcr-line-height-body);
  color: var(--pcr-text-primary);
}

.state-panel__copy span {
  font-size: var(--pcr-font-size-caption);
  line-height: var(--pcr-line-height-body);
  color: var(--pcr-text-muted);
}

.chart-skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background: var(--pcr-bg-subtle);
  border-radius: var(--pcr-radius-md);
  font-size: var(--pcr-font-size-small);
  color: var(--pcr-text-muted);
}

@media (max-width: 1100px) {
  .statistics-section {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .dashboard-page {
    gap: 10px;
    padding: var(--pcr-space-4);
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .dashboard-header__description {
    max-width: none;
    text-align: left;
  }

  .trend-panel {
    padding: 12px 14px 14px;
  }

  .section-heading {
    flex-direction: column;
    gap: 2px;
    margin-bottom: 8px;
  }

  .section-heading__note {
    flex: 0 1 auto;
    max-width: none;
    text-align: left;
  }

  .state-panel {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .statistics-section {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
}
</style>
