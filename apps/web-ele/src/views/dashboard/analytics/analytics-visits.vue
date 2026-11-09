<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

interface Props {
  data: any[];
}

const props = defineProps<Props>();

const chartRef = ref<EchartsUIType>();

const { renderEcharts } = useEcharts(chartRef);

const renderChart = () => {
  renderEcharts({
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2%',
    },

    tooltip: {
      trigger: 'axis',
    },

    xAxis: {
      type: 'category',
      data: props.data.map((item) => item.month),
    },

    yAxis: {
      type: 'value',
    },

    series: [
      {
        type: 'bar',
        data: props.data.map((item) => item.visits),
      },
    ],
  });
};

// 数据变化重新绘制
watch(
  () => props.data,
  async () => {
    await nextTick();
    renderChart();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
