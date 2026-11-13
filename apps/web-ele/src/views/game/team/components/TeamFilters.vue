<script lang="ts" setup>
import type { TeamListParams } from '#/api/core/team';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { difficultyOptions } from '../team-utils';

const props = defineProps<{
  filters: TeamListParams;
}>();

const emit = defineEmits<{
  reset: [];
  search: [];
  'update:filters': [filters: TeamListParams];
}>();

function updateFilter<K extends keyof TeamListParams>(
  key: K,
  value: TeamListParams[K],
) {
  emit('update:filters', { ...props.filters, [key]: value });
}
</script>

<template>
  <section class="filter-panel pcr-filter-panel--compact pcr-surface">
    <ElForm
      class="pcr-filter-row"
      :model="filters"
      label-position="left"
      @submit.prevent="emit('search')"
    >
      <ElFormItem class="pcr-filter-item pcr-filter-item--sm" label="月份">
        <ElDatePicker
          :model-value="filters.month"
          type="month"
          value-format="YYYY-MM"
          clearable
          placeholder="选择月份"
          style="width: 100%"
          @update:model-value="updateFilter('month', $event)"
          @change="emit('search')"
        />
      </ElFormItem>
      <ElFormItem class="pcr-filter-item pcr-filter-item--xs" label="阶段">
        <ElSelect
          :model-value="filters.stage"
          clearable
          placeholder="全部阶段"
          style="width: 100%"
          @update:model-value="updateFilter('stage', $event)"
        >
          <ElOption label="B阶段" :value="2" />
          <ElOption label="C阶段" :value="3" />
          <ElOption label="D阶段" :value="4" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem class="pcr-filter-item pcr-filter-item--xs" label="BOSS">
        <ElSelect
          :model-value="filters.boss"
          clearable
          placeholder="全部BOSS"
          style="width: 100%"
          @update:model-value="updateFilter('boss', $event)"
        >
          <ElOption
            v-for="boss in [1, 2, 3, 4, 5]"
            :key="boss"
            :label="`${boss}王`"
            :value="boss"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem class="pcr-filter-item pcr-filter-item--xs" label="模式">
        <ElSelect
          :model-value="filters.mode"
          clearable
          placeholder="全部模式"
          style="width: 100%"
          @update:model-value="updateFilter('mode', $event)"
        >
          <ElOption label="手动" :value="2" />
          <ElOption label="自动" :value="1" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem class="pcr-filter-item pcr-filter-item--sm" label="作者">
        <ElInput
          :model-value="filters.author"
          clearable
          placeholder="作者"
          @update:model-value="updateFilter('author', $event)"
          @keyup.enter="emit('search')"
        />
      </ElFormItem>
      <ElFormItem class="pcr-filter-item pcr-filter-item--xs" label="攻击">
        <ElSelect
          :model-value="filters.atk_type"
          clearable
          placeholder="全部"
          style="width: 100%"
          @update:model-value="updateFilter('atk_type', $event)"
        >
          <ElOption label="物理" :value="1" />
          <ElOption label="魔法" :value="-1" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem class="pcr-filter-item pcr-filter-item--sm" label="难度">
        <ElSelect
          :model-value="filters.difficulty"
          clearable
          placeholder="全部难度"
          style="width: 100%"
          @update:model-value="updateFilter('difficulty', $event)"
        >
          <ElOption
            v-for="item in difficultyOptions"
            :key="item.value"
            :label="item.label"
            :value="Number(item.value)"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem class="pcr-filter-item pcr-filter-item--xs" label="状态">
        <ElSelect
          :model-value="filters.status"
          clearable
          placeholder="全部状态"
          style="width: 100%"
          @update:model-value="updateFilter('status', $event)"
        >
          <ElOption label="显示" :value="1" />
          <ElOption label="隐藏" :value="0" />
        </ElSelect>
      </ElFormItem>

      <div class="pcr-filter-actions">
        <ElButton class="pcr-filter-reset" @click="emit('reset')">
          重置
        </ElButton>
        <ElButton type="primary" class="search-button" @click="emit('search')">
          搜索
        </ElButton>
      </div>
    </ElForm>
  </section>
</template>

<style scoped>
.filter-panel {
  min-width: 0;
  padding: var(--pcr-space-3) var(--pcr-space-4);
}

.pcr-filter-row :deep(.el-input__wrapper),
.pcr-filter-row :deep(.el-select__wrapper) {
  min-height: 32px;
  background: var(--pcr-bg-surface);
  border-radius: var(--pcr-radius-md);
  box-shadow: 0 0 0 1px var(--pcr-border) inset;
}

.pcr-filter-row :deep(.el-input__wrapper:hover),
.pcr-filter-row :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--pcr-border-strong) inset;
}

.pcr-filter-row :deep(.el-input__wrapper.is-focus),
.pcr-filter-row :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    0 0 0 1px var(--pcr-color-primary) inset,
    var(--pcr-shadow-focus);
}

@media (max-width: 600px) {
  .filter-panel {
    padding: var(--pcr-space-3);
  }
}
</style>
