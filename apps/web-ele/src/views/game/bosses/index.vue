<script lang="ts" setup>
import type {
  BossOverview,
  BossPeriod,
  BossRecord,
  BossSeat,
} from '#/api/core/boss';

import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElMessage,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import {
  getBossOverviewApi,
  selectBossApi,
} from '#/api/core/boss';

import BossSeatList from './components/BossSeatList.vue';

const SEAT_LABELS: Record<number, string> = {
  1: '一王',
  2: '二王',
  3: '三王',
  4: '四王',
  5: '五王',
};

const { hasAccessByCodes } = useAccess();

const canList = computed(() => hasAccessByCodes(['system:boss:list']));
const canSelect = computed(() => hasAccessByCodes(['system:boss:select']));

const activePeriod = ref<BossPeriod>('current');
const currentOverview = ref<BossOverview | null>(null);
const previousOverview = ref<BossOverview | null>(null);
const expandedSeats = ref<number[]>([1]);
const selectingSorts = ref<number[]>([]);

const loading = reactive<Record<BossPeriod, boolean>>({
  current: false,
  previous: false,
});

const errors = reactive<Record<BossPeriod, string>>({
  current: '',
  previous: '',
});

const loaded = reactive<Record<BossPeriod, boolean>>({
  current: false,
  previous: false,
});

const currentSeats = computed(() => normalizeSeats(currentOverview.value));
const previousSeats = computed(() => normalizeSeats(previousOverview.value));

const currentMonthLabel = computed(() =>
  formatYearMonth(currentOverview.value?.year_month),
);

const previousMonthLabel = computed(() =>
  formatYearMonth(previousOverview.value?.year_month),
);

const currentSetCount = computed(
  () =>
    currentOverview.value?.seats.filter(
      (seat) => seat.display_source === 'current',
    ).length ?? 0,
);

const currentFallbackCount = computed(
  () =>
    currentOverview.value?.seats.filter(
      (seat) => seat.display_source === 'previous',
    ).length ?? 0,
);

function createEmptySeat(sort: number): BossSeat {
  return {
    sort,
    label: SEAT_LABELS[sort] ?? `${sort}王`,
    current_boss: null,
    previous_boss: null,
    display_boss: null,
    display_source: 'none',
    options: [],
  };
}

function normalizeSeats(overview: BossOverview | null): BossSeat[] {
  return Array.from({ length: 5 }, (_, index) => {
    const sort = index + 1;
    const seat = overview?.seats.find(
      (candidate) => Number(candidate.sort) === sort,
    );

    return seat
      ? {
          ...seat,
          sort,
          label: seat.label || SEAT_LABELS[sort] || `${sort}王`,
          options: Array.isArray(seat.options) ? seat.options : [],
        }
      : createEmptySeat(sort);
  });
}

function normalizeBoss(value: any, fallbackSort: number): BossRecord | null {
  if (!value || value.id === null || value.id === undefined) {
    return null;
  }

  return {
    id: Number(value.id),
    name: String(value.name || `BOSS ${fallbackSort}`),
    file_path: String(value.file_path || ''),
    image_url: String(value.image_url || ''),
    candidate_key: String(
      value.candidate_key
        || (value.file_path ? `file:${value.file_path}` : `name:${value.name}`),
    ),
    year_month:
      value.year_month === null || value.year_month === undefined
        ? null
        : String(value.year_month),
    status: Number(value.status) === 1 ? 1 : 0,
    sort: Number(value.sort || fallbackSort),
  };
}

function normalizeSeat(value: any, fallbackSort: number): BossSeat {
  const options = Array.isArray(value?.options)
    ? value.options
        .map((option: any) => normalizeBoss(option, fallbackSort))
        .filter((option: BossRecord | null): option is BossRecord =>
          option !== null,
        )
    : [];

  const displaySource = ['current', 'none', 'previous'].includes(
    value?.display_source,
  )
    ? value.display_source
    : 'none';

  return {
    sort: Number(value?.sort || fallbackSort),
    label:
      String(value?.label || '') ||
      SEAT_LABELS[fallbackSort] ||
      `${fallbackSort}王`,
    current_boss: normalizeBoss(value?.current_boss, fallbackSort),
    previous_boss: normalizeBoss(value?.previous_boss, fallbackSort),
    display_boss: normalizeBoss(value?.display_boss, fallbackSort),
    display_source: displaySource,
    options,
  };
}

function normalizeOverview(
  value: any,
  period: BossPeriod,
): BossOverview {
  if (!value || !Array.isArray(value.seats)) {
    throw new Error('BOSS 管理数据格式不正确');
  }

  const yearMonth = String(value.year_month || '');

  if (!/^\d{6}$/.test(yearMonth)) {
    throw new Error('BOSS 管理数据缺少有效月份');
  }

  return {
    period,
    year_month: yearMonth,
    previous_year_month: String(value.previous_year_month || ''),
    read_only: Boolean(value.read_only),
    seats: Array.from({ length: 5 }, (_, index) => {
      const sort = index + 1;
      const seat = value.seats.find(
        (candidate: any) => Number(candidate?.sort) === sort,
      );

      return normalizeSeat(seat, sort);
    }),
  };
}

function formatYearMonth(value?: string) {
  if (!value || !/^\d{6}$/.test(value)) {
    return '';
  }

  return `${value.slice(0, 4)}年${value.slice(4)}月`;
}

function setOverview(period: BossPeriod, overview: BossOverview) {
  if (period === 'current') {
    currentOverview.value = overview;
    return;
  }

  previousOverview.value = overview;
}

function replaceSeat(period: BossPeriod, seat: BossSeat) {
  const target =
    period === 'current' ? currentOverview.value : previousOverview.value;

  if (!target) {
    return;
  }

  const next: BossOverview = {
    ...target,
    seats: Array.from({ length: 5 }, (_, index) => {
      const sort = index + 1;
      const current =
        Number(seat.sort) === sort
          ? seat
          : target.seats.find(
              (candidate) => Number(candidate.sort) === sort,
            );

      return current
        ? {
            ...current,
            sort,
            options: Array.isArray(current.options) ? current.options : [],
          }
        : createEmptySeat(sort);
    }),
  };

  setOverview(period, next);
}

function syncPreviousFallback(updatedSeat: BossSeat) {
  const overview = currentOverview.value;

  if (!overview) {
    return;
  }

  currentOverview.value = {
    ...overview,
    seats: overview.seats.map((seat) => {
      if (seat.sort !== updatedSeat.sort || seat.display_source !== 'previous') {
        return seat;
      }

      return {
        ...seat,
        previous_boss: updatedSeat.previous_boss,
        display_boss: updatedSeat.previous_boss,
        display_source: updatedSeat.previous_boss ? 'previous' : 'none',
      };
    }),
  };
}

async function loadOverview(period: BossPeriod, force = false) {
  if (!canList.value || loading[period] || (!force && loaded[period])) {
    return;
  }

  loading[period] = true;
  errors[period] = '';

  try {
    const response = await getBossOverviewApi(period);
    setOverview(period, normalizeOverview(response, period));
    loaded[period] = true;
  } catch (error) {
    console.error(`加载${period === 'current' ? '本月' : '上月'} BOSS 数据失败:`, error);
    errors[period] = '加载 BOSS 数据失败，请稍后重试。';
  } finally {
    loading[period] = false;
  }
}

function handleTabChange(name: number | string) {
  activePeriod.value = name === 'previous' ? 'previous' : 'current';
  expandedSeats.value = [1];

  if (!loaded[activePeriod.value]) {
    void loadOverview(activePeriod.value);
  }
}

function retryLoad(period: BossPeriod) {
  expandedSeats.value = [1];
  void loadOverview(period, true);
}

function cloneBoss(boss: BossRecord | null): BossRecord | null {
  return boss ? { ...boss } : null;
}

function cloneSeat(seat: BossSeat): BossSeat {
  // Vue exposes reactive proxies, which structuredClone cannot clone.
  return {
    ...seat,
    current_boss: cloneBoss(seat.current_boss),
    previous_boss: cloneBoss(seat.previous_boss),
    display_boss: cloneBoss(seat.display_boss),
    options: seat.options.map((boss) => ({ ...boss })),
  };
}

function buildOptimisticSeat(
  period: BossPeriod,
  seat: BossSeat,
  boss: BossRecord,
): BossSeat {
  const overview =
    period === 'current' ? currentOverview.value : previousOverview.value;
  const selectedBoss: BossRecord = {
    ...boss,
    year_month: overview?.year_month ?? boss.year_month,
    status: 1,
  };

  const options = seat.options
    .map((option) => ({
      ...option,
      status:
        option.candidate_key === boss.candidate_key
          ? (1 as const)
          : (0 as const),
    }))
    .toSorted(
      (left, right) =>
        Number(right.candidate_key === boss.candidate_key)
          - Number(left.candidate_key === boss.candidate_key) ||
        left.name.localeCompare(right.name, 'zh-CN') ||
        left.id - right.id,
    );

  if (period === 'previous') {
    return {
      ...seat,
      previous_boss: selectedBoss,
      display_boss: selectedBoss,
      display_source: 'previous',
      options,
    };
  }

  return {
    ...seat,
    current_boss: selectedBoss,
    display_boss: selectedBoss,
    display_source: 'current',
    options,
  };
}

async function handleSelect(boss: BossRecord, seat: BossSeat) {
  if (
    !canSelect.value ||
    selectingSorts.value.includes(seat.sort)
  ) {
    return;
  }

  const period = activePeriod.value;
  const previousSeat = cloneSeat(seat);
  selectingSorts.value = [...selectingSorts.value, seat.sort];
  replaceSeat(period, buildOptimisticSeat(period, seat, boss));

  try {
    const response = await selectBossApi({
      boss_id: boss.id,
      period,
      sort: seat.sort,
    });
    const updatedSeat = normalizeSeat(response, seat.sort);

    if (!updatedSeat.display_boss) {
      throw new Error('BOSS 切换结果不完整');
    }

    replaceSeat(period, updatedSeat);

    if (period === 'current') {
      previousOverview.value = null;
      loaded.previous = false;
    } else {
      syncPreviousFallback(updatedSeat);
    }

    ElMessage.success(
      `${period === 'current' ? '本月' : '上月'}${seat.label}已切换为 ${updatedSeat.display_boss.name}`,
    );
  } catch (error) {
    console.error('切换 BOSS 失败:', error);
    replaceSeat(period, previousSeat);
    ElMessage.error('切换 BOSS 失败，已恢复原选择');
  } finally {
    selectingSorts.value = selectingSorts.value.filter(
      (sort) => sort !== seat.sort,
    );
  }
}

onMounted(() => {
  if (canList.value) {
    void loadOverview('current');
  }
});
</script>

<template>
  <div class="boss-management-page">
    <section class="page-hero">
      <div class="hero-copy">
        <div class="hero-kicker">BOSS MANAGEMENT</div>
        <h1>BOSS 管理</h1>
        <p>
          本月切换时，原本月 BOSS 会自动成为上月 BOSS；上月也可单独调整，不影响本月选择。
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-item">
          <span>固定王位</span>
          <strong>5</strong>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-current">
          <span>本月已设置</span>
          <strong>{{ currentSetCount }}</strong>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-fallback">
          <span>沿用上月</span>
          <strong>{{ currentFallbackCount }}</strong>
        </div>
      </div>
    </section>

    <ElCard shadow="never" class="management-card">
      <ElTabs
        v-model="activePeriod"
        class="boss-tabs"
        @tab-change="handleTabChange"
      >
        <ElTabPane name="current">
          <template #label>
            <span class="tab-label">
              本月 BOSS
              <small v-if="currentMonthLabel">{{ currentMonthLabel }}</small>
            </span>
          </template>

          <div
            v-if="!canList"
            class="permission-state"
          >
            <ElEmpty description="当前账号没有 BOSS 管理查询权限" />
          </div>

          <div v-else-if="errors.current" class="error-state">
            <ElEmpty :description="errors.current" />
            <ElButton type="primary" @click="retryLoad('current')">
              重新加载
            </ElButton>
          </div>

          <div v-else v-loading="loading.current" class="tab-panel">
            <div v-if="!canSelect" class="permission-note">
              当前账号只有查看权限，不能切换 BOSS。
            </div>

            <BossSeatList
              v-if="currentOverview || !loading.current"
              :seats="currentSeats"
              period="current"
              :can-select="canSelect"
              :selecting-sorts="selectingSorts"
              v-model:expanded-seats="expandedSeats"
              @select="handleSelect"
            />
            <div v-else class="loading-placeholder">
              正在加载本月 BOSS 数据...
            </div>
          </div>
        </ElTabPane>

        <ElTabPane name="previous">
          <template #label>
            <span class="tab-label">
              上月 BOSS
              <small v-if="previousMonthLabel">{{ previousMonthLabel }}</small>
            </span>
          </template>

          <div
            v-if="!canList"
            class="permission-state"
          >
            <ElEmpty description="当前账号没有 BOSS 管理查询权限" />
          </div>

          <div v-else-if="errors.previous" class="error-state">
            <ElEmpty :description="errors.previous" />
            <ElButton type="primary" @click="retryLoad('previous')">
              重新加载
            </ElButton>
          </div>

          <div v-else v-loading="loading.previous" class="tab-panel">
            <div v-if="!canSelect" class="permission-note">
              当前账号只有查看权限，不能切换 BOSS。
            </div>

            <BossSeatList
              v-if="previousOverview || !loading.previous"
              :seats="previousSeats"
              period="previous"
              :can-select="canSelect"
              :selecting-sorts="selectingSorts"
              v-model:expanded-seats="expandedSeats"
              @select="handleSelect"
            />
            <div v-else class="loading-placeholder">
              正在加载上月 BOSS 数据...
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<style scoped>
.boss-management-page {
  --boss-hero-amber: #d97706;
  --boss-hero-teal: #0f766e;

  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  padding: 20px;
}

.page-hero {
  position: relative;
  display: flex;
  gap: 28px;
  align-items: center;
  justify-content: space-between;
  padding: 26px 30px;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 10%, rgb(217 119 6 / 18%), transparent 28%),
    radial-gradient(circle at 68% 120%, rgb(15 118 110 / 14%), transparent 34%),
    linear-gradient(
      120deg,
      var(--el-color-primary-light-9),
      var(--el-bg-color) 56%,
      var(--el-fill-color-lighter)
    );
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
}

.page-hero::after {
  position: absolute;
  top: -40px;
  right: 34%;
  width: 130px;
  height: 180px;
  content: '';
  background: repeating-linear-gradient(
    90deg,
    transparent 0 14px,
    rgb(255 255 255 / 24%) 14px 16px
  );
  transform: rotate(28deg);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 720px;
}

.hero-kicker {
  margin-bottom: 8px;
  color: var(--boss-hero-amber);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.hero-copy h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.hero-copy p {
  max-width: 680px;
  margin: 10px 0 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.7;
}

.hero-stats {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  gap: 18px;
  align-items: center;
  padding: 16px 20px;
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 74px;
  text-align: center;
}

.stat-item span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.stat-item strong {
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 800;
}

.stat-current strong {
  color: var(--boss-hero-teal);
}

.stat-fallback strong {
  color: var(--boss-hero-amber);
}

.stat-divider {
  width: 1px;
  height: 34px;
  background: var(--el-border-color-lighter);
}

.management-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
}

.management-card :deep(.el-card__body) {
  padding: 0 20px 20px;
}

.boss-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.boss-tabs :deep(.el-tabs__item) {
  height: 56px;
}

.tab-label {
  display: inline-flex;
  gap: 8px;
  align-items: baseline;
  font-weight: 700;
}

.tab-label small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 500;
}

.tab-panel {
  min-height: 260px;
}

.permission-note {
  margin-bottom: 14px;
  padding: 10px 12px;
  color: var(--el-color-warning-dark-2);
  font-size: 13px;
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: 9px;
}

.permission-state,
.error-state {
  display: flex;
  min-height: 300px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-state {
  gap: 10px;
}

.loading-placeholder {
  display: flex;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

@media (max-width: 980px) {
  .page-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-stats {
    width: 100%;
    justify-content: space-around;
  }
}

@media (max-width: 640px) {
  .boss-management-page {
    padding: 12px;
  }

  .page-hero {
    padding: 20px;
    border-radius: 14px;
  }

  .hero-stats {
    gap: 8px;
    padding: 12px 10px;
  }

  .stat-item {
    min-width: 0;
  }

  .stat-item strong {
    font-size: 20px;
  }

  .management-card :deep(.el-card__body) {
    padding: 0 12px 14px;
  }

  .tab-label {
    align-items: flex-start;
    flex-direction: column;
    gap: 1px;
  }
}
</style>
