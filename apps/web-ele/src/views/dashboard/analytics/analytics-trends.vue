<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { AnalysisTrendItem } from '#/api/core/analytics';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { usePreferences } from '@vben/preferences';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useWindowSize } from '@vueuse/core';

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
type ChartOption = Parameters<typeof renderEcharts>[0];
const { isDark } = usePreferences();
const { width } = useWindowSize();

const isMobile = computed(() => width.value < 768);
const showEveryOtherLabel = computed(() => width.value < 900);
const months = computed(() => props.data.map((item) => item.month));
const visits = computed(() => props.data.map((item) => item.visits));
const newUsers = computed(() => props.data.map((item) => item.new_users));
const newRegisters = computed(() =>
  props.data.map((item) => item.new_registers),
);

function readToken(name: string, fallback: string) {
  if (typeof document === 'undefined') {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}

function formatValue(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  const numeric = Number(raw);

  return Number.isFinite(numeric)
    ? `${numeric.toLocaleString('zh-CN')} 人`
    : '-';
}

function buildOption(): ChartOption {
  const dark = isDark.value;
  const mobile = isMobile.value;
  const palette = [
    readToken('--pcr-color-primary', dark ? '#7b95ff' : '#3563f4'),
    readToken('--pcr-color-secondary', dark ? '#a28bff' : '#7658f6'),
    readToken('--pcr-success', dark ? '#4dc7a3' : '#1f9d78'),
  ];
  const axisText = readToken('--pcr-text-muted', dark ? '#8895aa' : '#8c96a8');
  const legendText = readToken(
    '--pcr-text-secondary',
    dark ? '#b7c2d4' : '#5e6a80',
  );
  const textPrimary = readToken(
    '--pcr-text-primary',
    dark ? '#eef3fb' : '#172033',
  );
  const gridLine = readToken('--pcr-border', dark ? '#263244' : '#e5e9f2');
  const axisPointer = readToken(
    '--pcr-border-strong',
    dark ? '#36445a' : '#d5dbe7',
  );
  const surface = readToken('--pcr-bg-surface', dark ? '#141c2b' : '#ffffff');

  return {
    legend: {
      bottom: mobile ? 0 : undefined,
      data: ['访问人次', '新增用户', '新增注册'],
      icon: 'roundRect',
      itemGap: 16,
      itemHeight: 3,
      itemWidth: 14,
      left: mobile ? 'center' : undefined,
      right: mobile ? undefined : 8,
      textStyle: {
        color: legendText,
        fontSize: 12,
      },
      top: mobile ? undefined : 0,
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: axisPointer,
          width: 1,
        },
        type: 'line',
      },
      backgroundColor: surface,
      borderColor: gridLine,
      borderWidth: 1,
      confine: true,
      padding: [10, 12],
      textStyle: {
        color: textPrimary,
        fontSize: 12,
      },
      trigger: 'axis',
      valueFormatter: (value) => formatValue(value),
    },
    grid: {
      bottom: mobile ? 40 : 6,
      containLabel: true,
      left: 4,
      right: 12,
      top: mobile ? 12 : 40,
    },
    xAxis: {
      axisLabel: {
        color: axisText,
        fontSize: 12,
        hideOverlap: true,
        interval: showEveryOtherLabel.value ? 1 : 0,
      },
      axisLine: {
        lineStyle: {
          color: gridLine,
        },
      },
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: months.value,
      splitLine: {
        show: false,
      },
      type: 'category',
    },
    yAxis: {
      axisLabel: {
        color: axisText,
        fontSize: 12,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: gridLine,
          type: 'dashed',
        },
        show: true,
      },
      type: 'value',
    },
    series: [
      {
        data: visits.value,
        emphasis: {
          focus: 'series',
        },
        itemStyle: {
          color: palette[0],
        },
        lineStyle: {
          color: palette[0],
          width: 2,
        },
        name: '访问人次',
        showSymbol: false,
        smooth: true,
        type: 'line',
      },
      {
        data: newUsers.value,
        emphasis: {
          focus: 'series',
        },
        itemStyle: {
          color: palette[1],
        },
        lineStyle: {
          color: palette[1],
          width: 2,
        },
        name: '新增用户',
        showSymbol: false,
        smooth: true,
        type: 'line',
      },
      {
        data: newRegisters.value,
        emphasis: {
          focus: 'series',
        },
        itemStyle: {
          color: palette[2],
        },
        lineStyle: {
          color: palette[2],
          width: 2,
        },
        name: '新增注册',
        showSymbol: false,
        smooth: true,
        type: 'line',
      },
    ],
  };
}

let renderSequence = 0;

async function renderChart() {
  const sequence = ++renderSequence;

  await nextTick();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  if (sequence !== renderSequence) {
    return;
  }

  void renderEcharts(buildOption());
}

watch(
  () => [props.data, isDark.value, isMobile.value, showEveryOtherLabel.value],
  () => {
    void renderChart();
  },
  { deep: true },
);

onMounted(() => {
  void renderChart();
});
</script>

<template>
  <div class="trend-chart">
    <EchartsUI ref="chartRef" height="100%" width="100%" />
  </div>
</template>

<style scoped>
.trend-chart {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}
</style>
