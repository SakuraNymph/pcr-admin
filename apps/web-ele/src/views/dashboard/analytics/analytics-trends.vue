<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

// 导入类型定义
import type { AnalysisTrendItem } from '#/api/core/analytics';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

// 1. 接收父组件传递过来的 trendData
const props = withDefaults(
  defineProps<{
    data?: AnalysisTrendItem[];
  }>(),
  {
    data: () => [],
  },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 2. 数据转换
const months = computed(() => props.data.map((item) => item.month));
const visitsData = computed(() => props.data.map((item) => item.visits));
const newUsersData = computed(() => props.data.map((item) => item.new_users));
const newRegistersData = computed(() =>
  props.data.map((item) => item.new_registers),
);

// 3. 渲染图表函数
function updateChart() {
  renderEcharts({
    legend: {
      data: ['访问量', '新增用户', '新增注册用户'],
      right: '2%',
      top: '2%',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        lineStyle: {
          color: '#019680',
          width: 1,
        },
      },
    },
    grid: {
      bottom: '3%',
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '12%',
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months.value,
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          type: 'solid',
          width: 1,
        },
        show: true,
      },
    },
    yAxis: [
      {
        type: 'value',
        axisTick: {
          show: false,
        },
        splitArea: {
          show: true,
        },
      },
    ],
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        data: visitsData.value,
        itemStyle: {
          color: '#5ab1ef',
        },
      },
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: newUsersData.value,
        itemStyle: {
          color: '#019680',
        },
      },
      {
        name: '新增注册用户',
        type: 'line',
        smooth: true,
        data: newRegistersData.value,
        itemStyle: {
          color: '#ffb980',
        },
      },
    ],
  });
}

// 4. 关键修复：使用 nextTick 确保 DOM 完全展开后再渲染
const safeRender = () => {
  if (props.data && props.data.length > 0) {
    nextTick(() => {
      updateChart();
    });
  }
};

// 监听数据更新
watch(
  () => props.data,
  () => {
    safeRender();
  },
  { immediate: true, deep: true },
);

// 组件重新加载或切回时强行重绘一次
onMounted(() => {
  safeRender();
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
