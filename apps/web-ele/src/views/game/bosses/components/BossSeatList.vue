<script lang="ts" setup>
import type { BossPeriod, BossRecord, BossSeat } from '#/api/core/boss';

import { computed } from 'vue';

import {
  ElAlert,
  ElCollapse,
  ElCollapseItem,
  ElImage,
  ElTag,
} from 'element-plus';

type TagType = 'info' | 'success' | 'warning';

const props = defineProps<{
  canSelect: boolean;
  expandedSeats: number[];
  period: BossPeriod;
  seats: BossSeat[];
  selectingSorts: number[];
}>();

const emit = defineEmits<{
  select: [boss: BossRecord, seat: BossSeat];
  'update:expandedSeats': [value: number[]];
}>();

const collapseValue = computed({
  get: () => props.expandedSeats,
  set: (value) => emit('update:expandedSeats', value),
});

const allEmpty = computed(() =>
  props.seats.every(
    (seat) => !seat.display_boss && seat.options.length === 0,
  ),
);

function isSeatSelecting(sort: number) {
  return props.selectingSorts.includes(sort);
}

function isSelectedOption(seat: BossSeat, boss: BossRecord) {
  const expectedSource = props.period === 'current' ? 'current' : 'previous';

  return seat.display_source === expectedSource
    && seat.display_boss?.candidate_key === boss.candidate_key;
}

function getGridStyle(count: number): Record<string, string> {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));

  return {
    '--boss-grid-columns': String(columns),
    '--boss-grid-width': `${columns * 104 + (columns - 1) * 10}px`,
  };
}

function getSourceLabel(seat: BossSeat) {
  if (props.period === 'previous') {
    return seat.display_boss ? '上月已选' : '未设置';
  }

  if (seat.display_source === 'current') {
    return '本月已选';
  }

  if (seat.display_source === 'previous') {
    return '沿用上月';
  }

  return '未设置';
}

function getSourceType(seat: BossSeat): TagType {
  if (
    (props.period === 'current' && seat.display_source === 'current')
    || (props.period === 'previous' && seat.display_source === 'previous')
  ) {
    return 'success';
  }

  if (props.period === 'current' && seat.display_source === 'previous') {
    return 'warning';
  }

  return 'info';
}

function handleSelect(seat: BossSeat, boss: BossRecord) {
  if (
    !props.canSelect ||
    isSeatSelecting(seat.sort) ||
    isSelectedOption(seat, boss)
  ) {
    return;
  }

  emit('select', boss, seat);
}
</script>

<template>
  <div class="boss-seat-list">
    <ElAlert
      v-if="allEmpty"
      title="当前没有可展示的 BOSS 数据"
      type="info"
      :closable="false"
      show-icon
      class="empty-alert"
    />

    <ElCollapse v-model="collapseValue" class="seat-collapse">
      <ElCollapseItem
        v-for="seat in seats"
        :key="seat.sort"
        :name="seat.sort"
        class="seat-collapse-item"
      >
        <template #title>
          <div class="seat-title">
            <div class="seat-thumbnail">
              <ElImage
                v-if="seat.display_boss?.image_url"
                :src="seat.display_boss.image_url"
                fit="contain"
                class="seat-image"
              >
                <template #error>
                  <div class="image-fallback">
                    BOSS {{ seat.sort }}
                  </div>
                </template>
              </ElImage>
              <div v-else class="image-fallback">
                BOSS {{ seat.sort }}
              </div>
            </div>

            <div class="seat-copy">
              <div class="seat-heading">
                <span class="seat-label">{{ seat.label }}</span>
                <ElTag
                  :type="getSourceType(seat)"
                  effect="light"
                  size="small"
                >
                  {{ getSourceLabel(seat) }}
                </ElTag>
              </div>
              <strong class="seat-boss-name">
                {{ seat.display_boss?.name || '未设置 BOSS' }}
              </strong>
              <span class="seat-option-count">
                {{ seat.options.length }} 个可选 BOSS
              </span>
            </div>
          </div>
        </template>

        <div class="selection-panel">
          <p class="selection-hint">
            {{
              period === 'current'
                ? '点击候选立即切换；原本月 BOSS 会自动成为上月 BOSS。'
                : '这里只修改上月 BOSS，不会影响本月选择。'
            }}
          </p>

          <div
            v-if="seat.options.length > 0"
            class="boss-option-grid"
            :style="getGridStyle(seat.options.length)"
          >
            <button
              v-for="boss in seat.options"
              :key="boss.id"
              type="button"
              class="boss-option"
              :class="{
                'is-selected': isSelectedOption(seat, boss),
                'is-selecting': isSeatSelecting(seat.sort),
              }"
              :disabled="!canSelect || isSeatSelecting(seat.sort)"
              :aria-pressed="isSelectedOption(seat, boss)"
              @click="handleSelect(seat, boss)"
            >
              <div class="option-thumbnail">
                <ElImage
                  v-if="boss.image_url"
                  :src="boss.image_url"
                  fit="contain"
                  class="option-image"
                >
                  <template #error>
                    <div class="image-fallback option-fallback">
                      BOSS {{ seat.sort }}
                    </div>
                  </template>
                </ElImage>
                <div v-else class="image-fallback option-fallback">
                  BOSS {{ seat.sort }}
                </div>
              </div>

              <div class="option-copy">
                <strong>{{ boss.name }}</strong>
              </div>

              <span
                v-if="isSelectedOption(seat, boss)"
                class="selected-mark"
                aria-hidden="true"
              >
                ✓
              </span>
            </button>
          </div>

          <div v-else class="seat-empty">
            该王位暂无可选 BOSS。
          </div>
        </div>
      </ElCollapseItem>
    </ElCollapse>
  </div>
</template>

<style scoped>
.boss-seat-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-alert {
  border-radius: 10px;
}

.seat-collapse {
  border: 0;
}

.seat-collapse :deep(.el-collapse-item) {
  margin-bottom: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
}

.seat-collapse :deep(.el-collapse-item:last-child) {
  margin-bottom: 0;
}

.seat-collapse :deep(.el-collapse-item__header) {
  min-height: 88px;
  height: auto;
  padding: 12px 18px;
  background: var(--el-fill-color-blank);
  border: 0;
}

.seat-collapse :deep(.el-collapse-item__wrap) {
  border: 0;
}

.seat-collapse :deep(.el-collapse-item__content) {
  padding: 0 18px 18px;
}

.seat-title {
  display: flex;
  flex: 1;
  gap: 14px;
  align-items: center;
  min-width: 0;
  padding-right: 14px;
  text-align: left;
}

.seat-thumbnail,
.option-thumbnail {
  flex: 0 0 auto;
  overflow: hidden;
  background:
    linear-gradient(135deg, var(--el-fill-color-light), var(--el-fill-color)),
    var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.seat-thumbnail {
  width: 64px;
  height: 64px;
  border-radius: 12px;
}

.seat-image,
.option-image {
  width: 100%;
  height: 100%;
}

.image-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.seat-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.seat-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.seat-label {
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.seat-boss-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seat-option-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.selection-panel {
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.selection-hint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.boss-option-grid {
  display: grid;
  width: 100%;
  max-width: var(--boss-grid-width);
  grid-template-columns: repeat(
    var(--boss-grid-columns),
    minmax(0, 1fr)
  );
  gap: 10px;
  justify-content: start;
}

.boss-option {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  aspect-ratio: 1;
  gap: 6px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
  text-align: center;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background-color 0.18s ease;
}

.boss-option:hover:not(:disabled) {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 6px 16px rgb(64 158 255 / 12%);
  transform: translateY(-1px);
}

.boss-option.is-selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.boss-option:disabled {
  cursor: wait;
  opacity: 0.72;
}

.option-thumbnail {
  width: min(58px, 58%);
  height: auto;
  aspect-ratio: 1;
  border-radius: 10px;
}

.option-fallback {
  font-size: 9px;
}

.option-copy {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.option-copy strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.3;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.selected-mark {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  width: 19px;
  height: 19px;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.seat-empty {
  padding: 18px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
}

@media (max-width: 760px) {
  .seat-collapse :deep(.el-collapse-item__header) {
    padding: 12px;
  }

  .seat-collapse :deep(.el-collapse-item__content) {
    padding: 0 12px 12px;
  }

  .seat-thumbnail {
    width: 56px;
    height: 56px;
  }

  .seat-boss-name {
    white-space: normal;
  }

  .boss-option-grid {
    gap: 8px;
  }

  .boss-option {
    padding: 6px 4px;
  }

  .option-copy strong {
    font-size: 11px;
  }
}
</style>
