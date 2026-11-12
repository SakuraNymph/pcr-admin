<script lang="ts" setup>
import type { TeamListItem } from '#/api/core/team';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  formatDamage,
  formatDateTime,
  getBossText,
  getDifficultyClass,
  getDifficultyText,
  getModeText,
  getStageClass,
  getStageText,
  getTableRoleForSlot,
  getTeamAuthor,
  getTeamDifficulty,
  getTeamLink,
} from '../team-utils';

defineProps<{
  canCreate: boolean;
  canDeleteLink: boolean;
  canUpdateLink: boolean;
  canUpdateLinkStatus: boolean;
  damageSort: -1 | 1;
  loading: boolean;
  rows: TeamListItem[];
  total: number;
}>();

const emit = defineEmits<{
  add: [];
  edit: [row: TeamListItem];
  hide: [row: TeamListItem];
  restore: [row: TeamListItem];
  toggleDamageSort: [];
}>();
</script>

<template>
  <ElCard class="table-card" shadow="never">
    <template #header>
      <div class="table-header">
        <div class="table-header-left">
          <span class="table-title"> 作业列表 </span>
          <span class="table-count"> 共 {{ total }} 条 </span>
        </div>
        <ElButton v-if="canCreate" type="primary" @click="emit('add')">
          新增作业
        </ElButton>
      </div>
    </template>
    <ElTable
      v-loading="loading"
      :data="rows"
      border
      stripe
      row-key="link_id"
      class="team-table"
    >
      <ElTableColumn label="阶段" width="80" align="center">
        <template #default="{ row }">
          <span class="table-stage-tag" :class="getStageClass(row.stage)">
            {{ getStageText(row.stage) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="难度" width="110" align="center">
        <template #default="{ row }">
          <span
            class="table-difficulty-tag"
            :class="getDifficultyClass(getTeamDifficulty(row))"
          >
            {{ getDifficultyText(getTeamDifficulty(row)) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="伤害" width="120" align="center">
        <template #header>
          <button
            type="button"
            class="damage-sort-button"
            @click="emit('toggleDamageSort')"
          >
            伤害 {{ damageSort === 1 ? '↑' : '↓' }}
          </button>
        </template>
        <template #default="{ row }">
          <span class="table-damage" :title="`阵容最高伤害 ${row.team_damage}`">
            {{ formatDamage(row.damage) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="Boss" width="120" align="center">
        <template #default="{ row }">
          <span class="table-boss">
            {{ getBossText(row) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="角色"
        min-width="360"
        align="center"
        header-align="center"
      >
        <template #default="{ row }">
          <div class="table-role-list">
            <div
              v-for="roleIndex in 5"
              :key="roleIndex"
              class="table-role-slot"
            >
              <img
                v-if="getTableRoleForSlot(row, roleIndex - 1)?.image_url"
                :src="getTableRoleForSlot(row, roleIndex - 1)?.image_url ?? ''"
                :alt="getTableRoleForSlot(row, roleIndex - 1)?.nickname ?? ''"
                :title="getTableRoleForSlot(row, roleIndex - 1)?.nickname ?? ''"
                class="table-role-avatar"
              />
              <div v-else class="table-role-avatar empty"></div>
            </div>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="作者" width="110" align="center">
        <template #default="{ row }">
          <a
            v-if="getTeamLink(row)"
            :href="getTeamLink(row)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ getTeamAuthor(row) }}
          </a>
          <span v-else>{{ getTeamAuthor(row) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="模式" width="80" align="center">
        <template #default="{ row }">
          <span
            class="table-mode-tag"
            :class="Number(row.mode) === 1 ? 'mode-auto' : 'mode-manual'"
          >
            {{ getModeText(row.mode) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="80" align="center">
        <template #default="{ row }">
          <span
            class="table-status-tag"
            :class="
              Number(row.status) === 1 ? 'status-visible' : 'status-hidden'
            "
          >
            {{ Number(row.status) === 1 ? '显示' : '隐藏' }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="更新时间"
        prop="updated_at"
        width="170"
        align="center"
      >
        <template #default="{ row }">
          {{ formatDateTime(row.updated_at) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="130" fixed="right" align="center">
        <template #default="{ row }">
          <div class="table-actions">
            <ElButton
              v-if="canUpdateLink"
              link
              type="primary"
              @click="emit('edit', row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-if="Number(row.status) === 1 && canDeleteLink"
              link
              type="danger"
              @click="emit('hide', row)"
            >
              隐藏
            </ElButton>
            <ElButton
              v-else-if="Number(row.status) === 0 && canUpdateLinkStatus"
              link
              type="success"
              @click="emit('restore', row)"
            >
              恢复
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
      <template #empty>
        <ElEmpty description="暂无作业" />
      </template>
    </ElTable>
  </ElCard>
</template>

<style scoped>
.table-card {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
}

.table-card :deep(.el-card__header) {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
}

.table-card :deep(.el-card__body) {
  background: var(--el-bg-color);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-header-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.table-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.team-table {
  width: 100%;
}

.team-table :deep(.el-table__header-wrapper th) {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.team-table :deep(.el-table__row) {
  background: var(--el-bg-color);
}

.team-table :deep(.el-table__row--striped td) {
  background: var(--el-fill-color-lighter);
}

.team-table :deep(.el-table__row:hover > td) {
  background: var(--el-fill-color);
}

.table-stage-tag,
.table-difficulty-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 9px;
  font-size: 12px;
  white-space: nowrap;
  border: 1px solid;
  border-radius: 4px;
}

.table-damage,
.table-boss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.table-damage {
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
  background: #fff1f0;
  border-color: #fecdca;
}

.table-role-list {
  display: flex;
  justify-content: center;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.table-mode-tag,
.table-status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  border-radius: 4px;
}

.mode-auto {
  background: #529b2e;
}

.mode-manual {
  background: #337ecc;
}

.status-visible {
  background: #337ecc;
}

.status-hidden {
  background: #e45656;
}

.damage-sort-button {
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
  font: inherit;
}

.table-role-slot {
  width: 42px;
  height: 42px;
}

.table-role-avatar {
  display: block;
  width: 42px;
  height: 42px;
  object-fit: cover;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 5px;
}

.table-role-avatar.empty {
  border-style: dashed;
}

.empty-text {
  color: var(--el-text-color-placeholder);
}

.table-actions {
  display: flex;
  justify-content: center;
}

.stage-b {
  color: #fff !important;
  background: #337ecc !important;
  border-color: #337ecc !important;
}

.stage-c {
  color: #fff !important;
  background: #b88230 !important;
  border-color: #b88230 !important;
}

.stage-d {
  color: #fff !important;
  background: #c45656 !important;
  border-color: #c45656 !important;
}

.difficulty-auto {
  color: #fff !important;
  background: #529b2e !important;
  border-color: #529b2e !important;
}

.difficulty-simple-set {
  color: #fff !important;
  background: #337ecc !important;
  border-color: #337ecc !important;
}

.difficulty-switch-set {
  color: #fff !important;
  background: #b88230 !important;
  border-color: #b88230 !important;
}

.difficulty-simple-timing {
  color: #fff !important;
  background: #8e5cb7 !important;
  border-color: #8e5cb7 !important;
}

.difficulty-timing {
  color: #fff !important;
  background: #c45656 !important;
  border-color: #c45656 !important;
}
</style>
