<script lang="ts" setup>
import type { TeamListParams } from '#/api/core/team';

import {
  ElButton,
  ElCard,
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
  <ElCard class="search-card" shadow="never">
    <ElForm :model="filters" label-width="70px">
      <div class="search-grid">
        <ElFormItem label="月份">
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
        <ElFormItem label="阶段">
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
        <ElFormItem label="BOSS">
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
        <ElFormItem label="模式">
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
        <ElFormItem label="作者">
          <ElInput
            :model-value="filters.author"
            clearable
            placeholder="作者"
            @update:model-value="updateFilter('author', $event)"
            @keyup.enter="emit('search')"
          />
        </ElFormItem>
        <ElFormItem label="攻击">
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
        <ElFormItem label="难度">
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
        <ElFormItem label="状态">
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
      </div>
      <div class="search-actions">
        <ElButton @click="emit('reset')"> 重置 </ElButton>
        <ElButton type="primary" @click="emit('search')"> 搜索 </ElButton>
      </div>
    </ElForm>
  </ElCard>
</template>

<style scoped>
.search-card {
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
}

.search-card :deep(.el-card__body) {
  padding: 18px 20px 8px;
  background: var(--el-bg-color);
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0 16px;
}

.search-grid :deep(.el-form-item) {
  margin-bottom: 16px;
}

.search-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 8px;
}

@media (max-width: 1100px) {
  .search-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .search-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 380px) {
  .search-grid {
    grid-template-columns: 1fr;
  }
}
</style>
