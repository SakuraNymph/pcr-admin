<script lang="ts" setup>
import type { TeamListItem } from '#/api/core/team';

import { ElButton, ElEmpty, ElTable, ElTableColumn } from 'element-plus';

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
  error: string;
  errorStatus: null | number;
  loading: boolean;
  rows: TeamListItem[];
  total: number;
}>();

const emit = defineEmits<{
  add: [];
  edit: [row: TeamListItem];
  hide: [row: TeamListItem];
  retry: [];
  restore: [row: TeamListItem];
  toggleDamageSort: [];
}>();
</script>

<template>
  <section class="table-panel pcr-table-shell">
    <div class="pcr-table-head">
      <span class="pcr-table-head__count"> 共 {{ total }} 条来源记录 </span>
      <div class="pcr-table-head__tools">
        <ElButton v-if="canCreate" type="primary" @click="emit('add')">
          新增作业
        </ElButton>
      </div>
    </div>

    <p v-if="!error" class="scroll-hint">左右滑动查看完整字段</p>

    <div v-if="error" class="table-state">
      <p class="state-title">{{ error }}</p>
      <ElButton
        v-if="errorStatus !== 403"
        type="primary"
        plain
        @click="emit('retry')"
      >
        重新加载
      </ElButton>
    </div>

    <ElTable
      v-else
      v-loading="loading"
      :data="rows"
      element-loading-background="var(--pcr-bg-surface)"
      element-loading-text="加载作业数据…"
      row-key="link_id"
      class="team-table"
    >
      <ElTableColumn label="阶段" width="72" align="center">
        <template #default="{ row }">
          <span class="table-stage-tag" :class="getStageClass(row.stage)">
            {{ getStageText(row.stage) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="难度" width="100" align="center">
        <template #default="{ row }">
          <span
            class="table-difficulty-tag"
            :class="getDifficultyClass(getTeamDifficulty(row))"
          >
            {{ getDifficultyText(getTeamDifficulty(row)) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="伤害" width="108" align="center">
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
      <ElTableColumn label="Boss" width="88" align="center">
        <template #default="{ row }">
          <span class="table-boss">
            {{ getBossText(row) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="角色"
        min-width="250"
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
      <ElTableColumn label="作者" width="96" align="center">
        <template #default="{ row }">
          <a
            v-if="getTeamLink(row)"
            :href="getTeamLink(row)"
            class="table-author table-author-link"
            :title="getTeamAuthor(row)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ getTeamAuthor(row) }}
          </a>
          <span v-else class="table-author" :title="getTeamAuthor(row)">
            {{ getTeamAuthor(row) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="模式" width="76" align="center">
        <template #default="{ row }">
          <span
            class="table-mode-tag"
            :class="Number(row.mode) === 1 ? 'mode-auto' : 'mode-manual'"
          >
            {{ getModeText(row.mode) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="76" align="center">
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
        width="140"
        align="center"
      >
        <template #default="{ row }">
          <span class="table-time">{{ formatDateTime(row.updated_at) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <div class="table-actions">
            <ElButton
              v-if="canUpdateLink"
              link
              type="primary"
              class="action-edit"
              @click="emit('edit', row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-if="Number(row.status) === 1 && canDeleteLink"
              link
              type="danger"
              class="action-hide"
              @click="emit('hide', row)"
            >
              隐藏
            </ElButton>
            <ElButton
              v-else-if="Number(row.status) === 0 && canUpdateLinkStatus"
              link
              type="success"
              class="action-restore"
              @click="emit('restore', row)"
            >
              恢复
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
      <template #empty>
        <div class="empty-state">
          <ElEmpty :image-size="72" description="暂无作业" />
          <p>调整筛选条件或新增作业后再试</p>
        </div>
      </template>
    </ElTable>
  </section>
</template>

<style scoped>
.table-panel {
  min-width: 0;
  overflow: hidden;
}

.scroll-hint {
  display: none;
  margin: var(--pcr-space-2) var(--pcr-space-5) 0;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}

.team-table {
  width: 100%;
  --el-table-bg-color: var(--pcr-bg-surface);
  --el-table-border-color: var(--pcr-border);
  --el-table-expanded-cell-bg-color: var(--pcr-bg-surface);
  --el-table-header-bg-color: var(--pcr-bg-subtle);
  --el-table-row-hover-bg-color: var(--pcr-bg-subtle);
  --el-table-tr-bg-color: var(--pcr-bg-surface);
}

.team-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.team-table :deep(th.el-table__cell) {
  height: 44px;
  padding: 0 6px;
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-semibold);
  color: var(--pcr-text-secondary);
  background: var(--pcr-bg-subtle);
  border-bottom: 1px solid var(--pcr-border);
}

.team-table :deep(td.el-table__cell) {
  height: 60px;
  padding: 8px 6px;
  font-size: var(--pcr-font-size-small);
  color: var(--pcr-text-primary);
  background: var(--pcr-bg-surface);
  border-bottom: 1px solid var(--pcr-border);
}

.team-table :deep(.el-table__cell > .cell) {
  padding: 0 2px;
}

.team-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--pcr-bg-subtle);
}

.team-table :deep(.el-table-fixed-column--right) {
  background: var(--pcr-bg-surface);
}

.team-table :deep(.el-table__row:hover .el-table-fixed-column--right) {
  background: var(--pcr-bg-subtle);
}

.table-stage-tag,
.table-difficulty-tag,
.table-mode-tag,
.table-status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 8px;
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: var(--pcr-radius-sm);
}

.table-damage {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 9px;
  font-size: var(--pcr-font-size-small);
  font-weight: var(--pcr-font-weight-bold);
  color: var(--pcr-danger);
  white-space: nowrap;
  background: var(--pcr-danger-soft);
  border-radius: var(--pcr-radius-sm);
}

.table-boss {
  font-size: var(--pcr-font-size-small);
  font-weight: var(--pcr-font-weight-medium);
  color: var(--pcr-text-secondary);
  white-space: nowrap;
}

.table-role-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.damage-sort-button {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 0;
  font: inherit;
  font-weight: var(--pcr-font-weight-semibold);
  color: var(--pcr-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  transition: color 0.2s;
}

.damage-sort-button:hover {
  color: var(--pcr-color-primary);
}

.table-role-slot {
  flex: none;
  width: 40px;
  height: 40px;
}

.table-role-avatar {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: cover;
  background: var(--pcr-bg-subtle);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-sm);
}

.table-role-avatar.empty {
  background: transparent;
  border-style: dashed;
}

.table-author {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: var(--pcr-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-author-link {
  color: var(--pcr-color-primary);
  text-decoration: none;
}

.table-author-link:hover {
  color: var(--pcr-color-primary-hover);
  text-decoration: underline;
}

.table-time {
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
  white-space: nowrap;
}

.table-actions {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.table-actions :deep(.el-button) {
  height: 26px;
  padding: 0 6px;
  margin-left: 0;
  font-size: var(--pcr-font-size-caption);
}

.table-actions :deep(.action-hide) {
  color: var(--pcr-danger);
}

.table-actions :deep(.action-restore) {
  color: var(--pcr-success);
}

.table-state {
  display: flex;
  flex-direction: column;
  gap: var(--pcr-space-3);
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: var(--pcr-space-7) var(--pcr-space-4);
  text-align: center;
}

.state-title {
  margin: 0;
  font-size: var(--pcr-font-size-small);
  color: var(--pcr-text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--pcr-space-1);
  align-items: center;
  padding: var(--pcr-space-6) 0;
}

.empty-state p {
  margin: 0;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}

.stage-b {
  color: var(--pcr-info);
  background: var(--pcr-info-soft);
}

.stage-c {
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
}

.stage-d {
  color: var(--pcr-color-secondary);
  background: var(--pcr-color-secondary-soft);
}

.difficulty-auto {
  color: var(--pcr-success);
  background: var(--pcr-success-soft);
}

.difficulty-simple-set {
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
}

.difficulty-switch-set {
  color: var(--pcr-warning);
  background: var(--pcr-warning-soft);
}

.difficulty-simple-timing {
  color: var(--pcr-color-secondary);
  background: var(--pcr-color-secondary-soft);
}

.difficulty-timing {
  color: var(--pcr-danger);
  background: var(--pcr-danger-soft);
}

.mode-auto {
  color: var(--pcr-success);
  background: var(--pcr-success-soft);
}

.mode-manual {
  color: var(--pcr-info);
  background: var(--pcr-info-soft);
}

.status-visible {
  color: var(--pcr-success);
  background: var(--pcr-success-soft);
}

.status-hidden {
  color: var(--pcr-danger);
  background: var(--pcr-danger-soft);
}

@media (max-width: 900px) {
  .scroll-hint {
    display: block;
  }
}

@media (max-width: 600px) {
  .scroll-hint {
    margin-right: var(--pcr-space-4);
    margin-left: var(--pcr-space-4);
  }
}
</style>
