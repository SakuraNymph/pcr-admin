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
    <div
      v-for="(record, index) in records"
      :key="index"
      class="job-item"
    >
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
        <button
          type="button"
          class="action-btn"
          @click="emit('copy', record)"
        >
          复制
        </button>
        <button
          type="button"
          class="action-btn"
          @click="emit('edit', index)"
        >
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
  display: grid;
  grid-template-columns:
    60px
    92px
    82px
    minmax(210px, 1fr)
    minmax(240px, 1.15fr)
    150px;
  column-gap: 18px;
  align-items: center;
  min-height: 82px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.job-item:hover {
  border-color: var(--el-border-color);
  box-shadow: 0 3px 10px rgb(0 0 0 / 5%);
}

.job-basic {
  display: contents;
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
  color: #fff;
  white-space: nowrap;
  background: #606266;
  border: 1px solid #606266;
  border-radius: 4px;
}

.job-boss {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
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
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.job-roles {
  display: grid;
  grid-template-columns: repeat(5, 42px);
  column-gap: 8px;
  align-items: start;
  justify-content: center;
  min-width: 0;
}

.role-slot {
  width: 42px;
  text-align: center;
}

.role-avatar {
  display: block;
  width: 42px;
  height: 42px;
  object-fit: cover;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 5px;
}

.role-slot.empty .role-avatar {
  background: var(--el-fill-color-lighter);
  border-style: dashed;
}

.role-avatar-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.role-name {
  display: none;
}

.job-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  width: 150px;
}

.action-btn {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  border: 0;
  border-radius: 4px;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.job-actions .action-btn:nth-child(1) {
  background: #52c41a;
}

.job-actions .action-btn:nth-child(1):hover {
  background: #73d13d;
}

.job-actions .action-btn:nth-child(2) {
  background: #1677ff;
}

.job-actions .action-btn:nth-child(2):hover {
  background: #4096ff;
}

.job-actions .action-btn:nth-child(3) {
  background: #ff4d4f;
}

.job-actions .action-btn:nth-child(3):hover {
  background: #ff7875;
}

.job-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
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

@media (max-width: 900px) {
  .job-item {
    display: grid;
    grid-template-areas:
      'basic roles actions'
      'boss roles actions';
    grid-template-rows: 42px 42px;
    grid-template-columns:
      230px
      234px
      150px;
    gap: 9px 12px;
    align-items: center;
    min-height: 0;
    padding: 10px 11px;
  }

  .job-basic {
    display: grid;
    grid-area: basic;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 8px;
    align-items: center;
    width: 230px;
    min-width: 230px;
  }

  .job-stage {
    align-self: center;
    justify-content: stretch;
    width: 100%;
  }

  .job-stage .stage-tag {
    width: 100%;
  }

  .job-difficulty {
    align-self: center;
    justify-content: stretch;
    width: 100%;
  }

  .job-difficulty .difficulty-tag {
    width: 100%;
    min-width: 0;
  }

  .job-damage {
    align-self: center;
    width: 100%;
    height: 28px;
    font-size: 13px;
  }

  .job-boss {
    display: flex;
    grid-area: boss;
    align-items: center;
    justify-content: flex-start;
    width: 230px;
    min-width: 230px;
    min-height: 32px;
    overflow: hidden;
  }

  .job-boss .boss-tag {
    flex: none;
    width: 230px;
    min-width: 230px;
    max-width: 230px;
  }

  .job-roles {
    display: grid;
    grid-area: roles;
    grid-template-columns: repeat(5, 42px);
    column-gap: 6px;
    align-items: center;
    align-self: center;
    justify-content: start;
    width: 234px;
    min-width: 234px;
    height: 84px;
    padding: 0;
    margin: 0;
    transform: translateX(8px);
  }

  .role-slot {
    width: 42px;
  }

  .role-avatar {
    width: 42px;
    height: 42px;
  }

  .job-actions {
    display: flex;
    grid-area: actions;
    gap: 6px;
    align-items: center;
    align-self: center;
    justify-content: flex-start;
    width: 150px;
    height: 84px;
    min-height: 28px;
    transform: translateX(8px);
  }

  .action-btn {
    flex: none;
    height: 28px;
    padding: 0 10px;
  }
}

@media (max-width: 600px) {
  .job-list {
    gap: 7px;
  }

  .job-item {
    grid-template-areas:
      'basic roles actions'
      'boss roles actions';
    grid-template-rows: 36px 36px;
    grid-template-columns:
      201px
      206px
      110px;
    gap: 8px;
    padding: 9px;
  }

  .job-basic {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 8px;
    align-items: center;
    width: 201px;
    min-width: 201px;
  }

  .stage-tag {
    width: 100%;
    height: 26px;
  }

  .job-difficulty {
    width: 100%;
  }

  .difficulty-tag {
    width: 100%;
    min-width: 0;
    height: 26px;
    padding: 0 7px;
    font-size: 11px;
  }

  .job-damage {
    width: 100%;
    height: 26px;
    font-size: 12px;
  }

  .job-boss {
    width: 201px;
    min-width: 201px;
  }

  .job-boss .boss-tag {
    width: 201px;
    min-width: 201px;
    max-width: 201px;
    height: 28px;
  }

  .job-roles {
    grid-template-columns: repeat(5, 38px);
    column-gap: 4px;
    align-items: center;
    justify-content: start;
    width: 206px;
    min-width: 206px;
    height: 72px;
    margin: 0;
    transform: translateX(8px);
  }

  .role-slot {
    width: 38px;
  }

  .role-avatar {
    width: 38px;
    height: 38px;
  }

  .job-actions {
    gap: 5px;
    justify-content: flex-start;
    width: 110px;
    height: 72px;
    transform: translateX(8px);
  }

  .action-btn {
    height: 27px;
    padding: 0 7px;
    font-size: 11px;
  }
}

@media (max-width: 380px) {
  .job-item {
    grid-template-areas:
      'basic roles actions'
      'boss roles actions';
    grid-template-rows: 34px 34px;
    grid-template-columns:
      178px
      192px
      100px;
    gap: 7px 6px;
    padding: 8px;
  }

  .job-basic {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 6px;
    align-items: center;
    width: 178px;
    min-width: 178px;
  }

  .stage-tag {
    width: 100%;
    height: 25px;
  }

  .difficulty-tag {
    width: 100%;
    min-width: 0;
    height: 25px;
    padding: 0 6px;
    font-size: 10px;
  }

  .job-damage {
    width: 100%;
    height: 25px;
    font-size: 11px;
  }

  .job-boss {
    width: 178px;
    min-width: 178px;
  }

  .boss-tag {
    width: 178px;
    min-width: 178px;
    max-width: 178px;
    height: 27px;
    padding: 0 8px;
    font-size: 10px;
  }

  .job-roles {
    grid-template-columns: repeat(5, 36px);
    column-gap: 3px;
    justify-content: start;
    width: 192px;
    min-width: 192px;
    height: 68px;
    margin: 0;
    transform: translateX(8px);
  }

  .role-slot {
    width: 36px;
  }

  .role-avatar {
    width: 36px;
    height: 36px;
  }

  .job-actions {
    gap: 4px;
    width: 100px;
    height: 68px;
    transform: translateX(8px);
  }

  .action-btn {
    padding: 0 5px;
  }
}

.job-boss {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  align-items: center;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100%;
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
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.1;
  white-space: nowrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 5px;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.job-boss-choice.active {
  color: #fff;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.job-boss-choice small {
  max-width: 100%;
  overflow: hidden;
  font-size: 9px;
  font-weight: 600;
  text-overflow: ellipsis;
}
</style>
