<script lang="ts" setup>
import type { TeamDraftRecord } from '../team-utils';

import type { TeamRoleOption } from '#/api/core/team';

import { ElEmpty } from 'element-plus';

import {
  bossOptions,
  getDifficultyClass,
  getDifficultyText,
  getRecordDamageText,
  getRoleDamage,
  getRoleForSlot,
  getRoleOptionByNickname,
  getStageClass,
  isFixedDamageStage,
} from '../team-utils';

defineProps<{
  records: TeamDraftRecord[];
  roleOptions: TeamRoleOption[];
}>();

const emit = defineEmits<{
  copy: [record: TeamDraftRecord];
  edit: [index: number];
  remove: [index: number];
}>();
</script>

<template>
  <div v-if="records.length > 0" class="job-list">
    <div v-for="(record, index) in records" :key="index" class="job-item">
      <div class="job-basic">
        <div class="job-stage">
          <span class="stage-tag" :class="getStageClass(record.stage)">
            {{ record.stage }}阶段
          </span>
        </div>
        <div class="job-difficulty">
          <span
            class="difficulty-tag"
            :class="getDifficultyClass(record.difficulty)"
          >
            {{ getDifficultyText(record.difficulty) }}
          </span>
        </div>
        <div class="job-damage">
          {{ getRecordDamageText(record) }}
        </div>
      </div>
      <div class="job-boss">
        <span
          v-for="boss in bossOptions"
          :key="boss"
          class="job-boss-choice"
          :class="{ active: record.boss.includes(boss) }"
        >
          <span>{{ boss }}</span>
          <small
            v-if="
              record.boss.includes(boss) && isFixedDamageStage(record.stage)
            "
          >
            {{ getRoleDamage(record.stage, boss) }}
          </small>
        </span>
      </div>
      <div class="job-roles">
        <div
          v-for="roleIndex in 5"
          :key="roleIndex"
          class="role-slot"
          :class="{
            empty: !getRoleForSlot(record.roles, roleIndex - 1, roleOptions),
          }"
        >
          <img
            v-if="
              getRoleOptionByNickname(
                getRoleForSlot(record.roles, roleIndex - 1, roleOptions),
                roleOptions,
              )?.image_url ?? ''
            "
            :src="
              getRoleOptionByNickname(
                getRoleForSlot(record.roles, roleIndex - 1, roleOptions),
                roleOptions,
              )?.image_url ?? ''
            "
            :alt="getRoleForSlot(record.roles, roleIndex - 1, roleOptions)"
            class="role-avatar"
          />
          <div
            v-else-if="getRoleForSlot(record.roles, roleIndex - 1, roleOptions)"
            class="role-avatar role-avatar-text"
          >
            {{
              getRoleForSlot(record.roles, roleIndex - 1, roleOptions).slice(
                0,
                1,
              )
            }}
          </div>
          <div v-else class="role-avatar"></div>
        </div>
      </div>
      <div class="job-actions">
        <button type="button" class="action-btn" @click="emit('copy', record)">
          复制
        </button>
        <button type="button" class="action-btn" @click="emit('edit', index)">
          编辑
        </button>
        <button
          type="button"
          class="action-btn delete"
          @click="emit('remove', index)"
        >
          删除
        </button>
      </div>
    </div>
  </div>
  <div v-else class="job-empty">
    <ElEmpty :image-size="80" description="暂未添加作业" />
  </div>
</template>

<style scoped>
.job-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.job-item {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  min-width: 0;
  padding: 12px 14px;
  background: var(--pcr-bg-surface);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-md);
  transition:
    background 0.2s,
    border-color 0.2s;
}

.job-item:hover {
  background: var(--pcr-bg-subtle);
  border-color: var(--pcr-border-strong);
}

.job-basic {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.job-stage {
  display: flex;
  justify-content: flex-start;
}

.stage-tag,
.difficulty-tag,
.boss-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  border-radius: 4px;
}

.stage-tag {
  width: 52px;
  height: 28px;
  font-weight: 600;
}

.job-difficulty {
  display: flex;
  justify-content: flex-start;
}

.difficulty-tag {
  min-width: 82px;
  height: 28px;
  padding: 0 9px;
  font-weight: 500;
}

.job-damage {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 28px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pcr-danger);
  white-space: nowrap;
  background: var(--pcr-danger-soft);
  border-radius: var(--pcr-radius-sm);
}

.job-boss {
  display: flex;
  flex: 1 1 190px;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 150px;
  overflow: hidden;
}

.boss-tag {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 32px;
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--pcr-text-secondary);
  white-space: nowrap;
  background: var(--pcr-bg-subtle);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-sm);
}

.job-roles {
  display: grid;
  flex: none;
  grid-template-columns: repeat(5, 40px);
  column-gap: 6px;
  align-items: start;
  justify-content: center;
  min-width: 0;
}

.role-slot {
  width: 40px;
  text-align: center;
}

.role-avatar {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: cover;
  background: var(--pcr-bg-subtle);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-sm);
}

.role-slot.empty .role-avatar {
  background: transparent;
  border-style: dashed;
}

.role-avatar-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}

.role-name {
  display: none;
}

.job-actions {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.action-btn {
  height: 30px;
  padding: 0 10px;
  font-size: var(--pcr-font-size-caption);
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--pcr-radius-sm);
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.job-actions .action-btn:nth-child(1) {
  color: var(--pcr-text-secondary);
  background: var(--pcr-bg-surface);
  border-color: var(--pcr-border);
}

.job-actions .action-btn:nth-child(1):hover {
  color: var(--pcr-text-primary);
  background: var(--pcr-bg-subtle);
  border-color: var(--pcr-border-strong);
}

.job-actions .action-btn:nth-child(2) {
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
  border-color: transparent;
}

.job-actions .action-btn:nth-child(2):hover {
  border-color: var(--pcr-color-primary);
}

.job-actions .action-btn:nth-child(3) {
  color: var(--pcr-danger);
  background: var(--pcr-danger-soft);
  border-color: transparent;
}

.job-actions .action-btn:nth-child(3):hover {
  border-color: var(--pcr-danger);
}

.job-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
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

@media (max-width: 900px) {
  .job-item {
    padding: 10px 11px;
  }

  .job-actions {
    margin-left: 0;
  }

  .action-btn {
    height: 29px;
    padding: 0 9px;
  }
}

@media (max-width: 600px) {
  .job-list {
    gap: 8px;
  }

  .job-item {
    gap: 8px;
    padding: 9px;
  }

  .job-basic {
    gap: 6px;
  }

  .stage-tag {
    height: 26px;
  }

  .difficulty-tag {
    height: 26px;
    padding: 0 7px;
    font-size: 11px;
  }

  .job-damage {
    height: 26px;
    font-size: 12px;
  }

  .job-boss {
    flex-basis: 100%;
    min-width: 0;
  }

  .job-roles {
    grid-template-columns: repeat(5, 36px);
    column-gap: 4px;
  }

  .role-slot {
    width: 36px;
  }

  .role-avatar {
    width: 36px;
    height: 36px;
  }

  .job-actions {
    justify-content: flex-end;
    width: 100%;
    margin-left: 0;
  }

  .action-btn {
    height: 28px;
    padding: 0 8px;
    font-size: 11px;
  }
}

@media (max-width: 380px) {
  .job-item {
    gap: 7px;
    padding: 8px;
  }

  .job-basic {
    flex-wrap: wrap;
  }

  .difficulty-tag {
    height: 25px;
    padding: 0 6px;
    font-size: 10px;
  }

  .job-damage {
    height: 25px;
    font-size: 11px;
  }

  .job-roles {
    grid-template-columns: repeat(5, 32px);
    column-gap: 3px;
  }

  .role-slot {
    width: 32px;
  }

  .role-avatar {
    width: 32px;
    height: 32px;
  }
}

.job-boss {
  display: grid;
  flex: 1 1 190px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  align-items: center;
  width: auto !important;
  min-width: 150px !important;
  max-width: none;
  overflow: visible !important;
}

.job-boss-choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 36px;
  padding: 2px 3px;
  overflow: hidden;
  color: var(--pcr-text-secondary);
  font-size: var(--pcr-font-size-caption);
  line-height: 1.1;
  white-space: nowrap;
  background: var(--pcr-bg-subtle);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-sm);
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.job-boss-choice.active {
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
  border-color: var(--pcr-color-primary);
}

.job-boss-choice small {
  max-width: 100%;
  overflow: hidden;
  font-size: 9px;
  font-weight: 600;
  text-overflow: ellipsis;
}
</style>
