<script lang="ts" setup>
import type { TabOption } from '@vben/types';

import type { AnalysisOverviewItem, AnalysisTrendItem } from '#/api/core/analytics';

import { onMounted, ref } from 'vue';

import { AnalysisChartsTabs } from '@vben/common-ui';

// 导入 API 接口与类型定义
import { getStatistics, getTrendData } from '#/api/core/analytics';

import AnalyticsTrends from './analytics-trends.vue';
import AnalyticsVisits from './analytics-visits.vue';
import MyAnalysisOverview from './MyAnalysisOverview.vue';

// 响应式数据定义
const loading = ref(false);
const overviewItems = ref<AnalysisOverviewItem[]>([]);
const trendData = ref<AnalysisTrendItem[]>([]);

// 选项卡配置
const chartTabs: TabOption[] = [
  {
    label: '流量趋势',
    value: 'trends',
  },
  {
    label: '月访问量',
    value: 'visits',
  },
];

// 请求后端统计接口
const fetchStatisticsData = async () => {
  try {
    loading.value = true;
    const data = await getStatistics();

    // 赋值卡片与图表数据
    overviewItems.value = data || [];
  } catch (error) {
    console.error('获取首页统计数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTrendData = async () => {
  try {
    loading.value = true;
    const data = await getTrendData();

    // 赋值卡片与图表数据
    trendData.value = data || [];
  } catch (error) {
    console.error('获取首页统计数据失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatisticsData();
  fetchTrendData();
});
</script>

<template>
  <div class="p-5">
    <!-- 顶部概览卡片列表 -->
    <MyAnalysisOverview :items="overviewItems" />

    <!-- 趋势与访问量图表选项卡 -->
    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #trends>
        <!-- 将接口返回的 trend 数据传给图表组件 -->
        <AnalyticsTrends :data="trendData" />
      </template>
      <template #visits>
        <AnalyticsVisits :data="trendData" />
      </template>
    </AnalysisChartsTabs>
  </div>
</template>
