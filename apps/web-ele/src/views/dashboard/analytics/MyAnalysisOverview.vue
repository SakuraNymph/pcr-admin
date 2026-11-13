<script lang="ts" setup>
import { computed } from 'vue';

export interface StatCardItem {
  subRatio?: string;
  subValue: number;
  title: string;
  value: number;
}

interface ComparisonView {
  text: string;
  tone: 'flat' | 'negative' | 'positive';
}

interface StatCardView extends StatCardItem {
  comparison: ComparisonView;
  dot: 'accent' | 'primary' | 'success';
  previous: string;
}

const props = withDefaults(
  defineProps<{
    items?: StatCardItem[];
    loading?: boolean;
    period?: 'month' | 'today';
  }>(),
  {
    items: () => [],
    loading: false,
    period: 'today',
  },
);

const periodTitle = computed(() =>
  props.period === 'month' ? '本月概览（截至今日）' : '今日概览',
);
const comparisonTitle = computed(() =>
  props.period === 'month' ? '较上月同期' : '较昨日',
);
const previousLabel = computed(() =>
  props.period === 'month' ? '上月同期' : '昨日',
);

const dotTones = ['primary', 'accent', 'success'] as const;

function formatNumber(value: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString('zh-CN') : '0';
}

function buildComparison(item: StatCardItem): ComparisonView {
  if (item.subValue === 0) {
    if (item.value > 0) {
      return { text: '本期新增', tone: 'positive' };
    }

    return { text: '持平', tone: 'flat' };
  }

  const ratio = (item.subRatio ?? '').trim();
  if (!ratio || ratio.includes('∞')) {
    return { text: '本期新增', tone: 'positive' };
  }

  const numeric = Number.parseFloat(ratio);
  if (!Number.isFinite(numeric)) {
    return { text: ratio, tone: 'flat' };
  }

  if (numeric > 0) {
    return { text: ratio, tone: 'positive' };
  }

  if (numeric < 0) {
    return { text: ratio, tone: 'negative' };
  }

  return { text: '0%', tone: 'flat' };
}

const cards = computed<StatCardView[]>(() =>
  props.items.map((item, index) => ({
    ...item,
    comparison: buildComparison(item),
    dot: dotTones[index % dotTones.length] ?? 'primary',
    previous: `${previousLabel.value} ${formatNumber(item.subValue)}`,
  })),
);
</script>

<template>
  <section class="stat-group" :aria-label="periodTitle">
    <div class="stat-group__header">
      <h2 class="stat-group__title">{{ periodTitle }}</h2>
      <span class="stat-group__hint">{{ comparisonTitle }}</span>
    </div>

    <div class="stat-grid">
      <template v-if="loading">
        <div
          v-for="index in 3"
          :key="index"
          class="stat-card stat-card--skeleton"
          aria-hidden="true"
        >
          <span class="skeleton-line skeleton-line--title"></span>
          <span class="skeleton-line skeleton-line--value"></span>
          <span class="skeleton-line skeleton-line--meta"></span>
        </div>
      </template>

      <template v-else>
        <article v-for="card in cards" :key="card.title" class="stat-card">
          <div class="stat-card__label">
            <span
              class="stat-card__dot"
              :class="`stat-card__dot--${card.dot}`"
            ></span>
            <span>{{ card.title }}</span>
          </div>

          <div class="stat-card__value">{{ formatNumber(card.value) }}</div>

          <div class="stat-card__comparison">
            <span
              class="stat-card__change"
              :class="`stat-card__change--${card.comparison.tone}`"
            >
              {{ card.comparison.text }}
            </span>
            <span class="stat-card__previous">{{ card.previous }}</span>
          </div>
        </article>
      </template>
    </div>

    <p v-if="!loading && cards.length === 0" class="stat-group__empty">
      暂无统计数据
    </p>
  </section>
</template>

<style scoped>
.stat-group {
  display: flex;
  flex-direction: column;
  gap: var(--pcr-space-2);
  min-width: 0;
}

.stat-group__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--pcr-space-2);
  flex-wrap: wrap;
}

.stat-group__title {
  margin: 0;
  font-size: 14px;
  font-weight: var(--pcr-font-weight-semibold);
  line-height: 1.4;
  color: var(--pcr-text-primary);
  letter-spacing: -0.01em;
}

.stat-group__hint {
  font-size: 11px;
  line-height: 1.4;
  color: var(--pcr-text-muted);
  white-space: nowrap;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
  background: var(--pcr-bg-surface);
  border: var(--pcr-border-width) solid var(--pcr-border);
  border-radius: var(--pcr-radius-lg);
}

.stat-card__label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-medium);
  line-height: 1.35;
  color: var(--pcr-text-secondary);
}

.stat-card__dot {
  flex: 0 0 auto;
  width: 5px;
  height: 5px;
  border-radius: var(--pcr-radius-pill);
}

.stat-card__dot--primary {
  background: var(--pcr-color-primary);
}

.stat-card__dot--accent {
  background: var(--pcr-color-secondary);
}

.stat-card__dot--success {
  background: var(--pcr-success);
}

.stat-card__value {
  font-size: 26px;
  font-weight: var(--pcr-font-weight-bold);
  line-height: 1.15;
  color: var(--pcr-text-primary);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-card__comparison {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1px 6px;
  min-width: 0;
}

.stat-card__change {
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-semibold);
  line-height: 1.35;
}

.stat-card__change--positive {
  color: var(--pcr-success);
}

.stat-card__change--negative {
  color: var(--pcr-danger);
}

.stat-card__change--flat {
  color: var(--pcr-text-muted);
}

.stat-card__previous {
  font-size: 11px;
  line-height: 1.35;
  color: var(--pcr-text-muted);
}

.stat-group__empty {
  margin: 0;
  font-size: var(--pcr-font-size-small);
  color: var(--pcr-text-muted);
}

.stat-card--skeleton {
  gap: var(--pcr-space-2);
}

.skeleton-line {
  display: block;
  background: var(--pcr-border);
  border-radius: var(--pcr-radius-pill);
  animation: pcr-skeleton-pulse 1.6s ease-in-out infinite;
}

.skeleton-line--title {
  width: 42%;
  height: 12px;
}

.skeleton-line--value {
  width: 64%;
  height: 24px;
}

.skeleton-line--meta {
  width: 52%;
  height: 12px;
}

@keyframes pcr-skeleton-pulse {
  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line {
    animation: none;
  }
}

@media (max-width: 767px) {
  .stat-card {
    padding: 10px 11px;
  }

  .stat-card__value {
    font-size: 24px;
  }
}
</style>
