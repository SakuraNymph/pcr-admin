<script lang="ts" setup>
import { computed, watch } from 'vue';

import { ElDialog, ElInput } from 'element-plus';

import { useTeamAddDialog } from '../composables/useTeamAddDialog';
import {
  bossOptions,
  difficultyOptions,
  isFixedDamageStage,
  stageOptions,
} from '../team-utils';
import TeamRecordList from './TeamRecordList.vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:visible': [visible: boolean];
}>();

const {
  activeRoleIndex,
  activeRoleQuery,
  addForm,
  addNextRecord,
  authorError,
  copyRecordRoles,
  currentRecord,
  damageError,
  deleteRecord,
  editRecord,
  getCurrentRoleForSlot,
  getCurrentRoleOptionForSlot,
  handleAuthorBlur,
  handleAuthorInput,
  handleDamageBlur,
  handleDamageInput,
  handleLinkBlur,
  handleLinkInput,
  handleOpen,
  lineupLoading,
  lineupSuggestions,
  linkError,
  parseRoles,
  roleInput,
  roleOptions,
  roleSuggestions,
  selectDifficulty,
  selectLineupSuggestion,
  selectRoleSuggestion,
  selectStage,
  setRoleInputRef,
  submitAllRecords,
  submitLoading,
  toggleBoss,
} = useTeamAddDialog({
  onSubmitted() {
    emit('update:visible', false);
    emit('submitted');
  },
});

const dialogVisible = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      handleOpen();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    class="team-add-dialog"
    width="calc(100vw - 48px)"
    top="4vh"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title"> 添加作业 </span>
        <span class="dialog-count">
          共
          {{ addForm.records.length }}
          条
        </span>
      </div>
    </template>
    <div class="dialog-page">
      <div class="layout">
        <div class="card job-card">
          <div class="card-header">
            <div class="card-title">已添加作业</div>
            <div class="card-count">
              共
              {{ addForm.records.length }}
              条
            </div>
          </div>
          <div class="card-body">
            <TeamRecordList
              :records="addForm.records"
              :role-options="roleOptions"
              @copy="copyRecordRoles"
              @edit="editRecord"
              @remove="deleteRecord"
            />
          </div>
        </div>
        <div class="card add-card">
          <div class="card-header">
            <div class="card-title">添加作业</div>
          </div>
          <div class="card-body">
            <div class="add-panel">
              <!-- 作者 -->
              <div class="form-item">
                <div class="form-label">作者</div>
                <ElInput
                  v-model="addForm.author"
                  class="input"
                  :class="{
                    'author-input-error': authorError,
                  }"
                  clearable
                  placeholder="请输入作者"
                  @input="handleAuthorInput"
                  @blur="handleAuthorBlur"
                />
                <div v-if="authorError" class="input-error-text">
                  {{ authorError }}
                </div>
              </div>
              <!-- 链接 -->
              <div class="form-item">
                <div class="form-label">链接</div>
                <ElInput
                  v-model="addForm.link"
                  class="input"
                  :class="{
                    'link-input-error': linkError,
                  }"
                  clearable
                  placeholder="请输入作业链接"
                  @input="handleLinkInput"
                  @blur="handleLinkBlur"
                />
                <div v-if="linkError" class="input-error-text">
                  {{ linkError }}
                </div>
              </div>
              <!-- 阶段 -->
              <div class="form-item">
                <div class="form-label">阶段</div>
                <div class="options stage-options">
                  <button
                    v-for="item in stageOptions"
                    :key="item.value"
                    type="button"
                    class="option-btn"
                    :class="{
                      active: currentRecord.stage === item.value,
                    }"
                    @click="selectStage(item.value)"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>
              <!-- Boss -->
              <div class="form-item">
                <div class="form-label">Boss</div>
                <div class="options boss-options">
                  <button
                    v-for="boss in bossOptions"
                    :key="boss"
                    type="button"
                    class="option-btn"
                    :class="{
                      active: currentRecord.boss.includes(boss),
                    }"
                    @click="toggleBoss(boss)"
                  >
                    {{ boss }}
                  </button>
                </div>
              </div>
              <!-- 难度 -->
              <div class="form-item">
                <div class="form-label">难度</div>
                <div class="options difficulty-options">
                  <button
                    v-for="item in difficultyOptions"
                    :key="item.value"
                    type="button"
                    class="option-btn"
                    :class="{
                      active: currentRecord.difficulty === item.value,
                    }"
                    @click="selectDifficulty(item.value)"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>
              <!-- 伤害 -->
              <div class="form-item">
                <div class="form-label">伤害</div>
                <div class="damage-row">
                  <ElInput
                    v-model="currentRecord.damage"
                    class="input"
                    :disabled="isFixedDamageStage(currentRecord.stage)"
                    :class="{
                      'damage-input-error': damageError,
                    }"
                    type="text"
                    inputmode="numeric"
                    :placeholder="
                      isFixedDamageStage(currentRecord.stage)
                        ? 'B/C阶段按Boss自动计算'
                        : '请输入1-99999的整数'
                    "
                    @input="handleDamageInput"
                    @blur="handleDamageBlur"
                  />
                </div>
                <div
                  v-if="isFixedDamageStage(currentRecord.stage)"
                  class="input-help-text"
                >
                  B/C 阶段伤害按所选 Boss 自动计算。
                </div>
                <div v-if="damageError" class="input-error-text">
                  {{ damageError }}
                </div>
              </div>
              <!-- 角色 -->
              <div class="form-item">
                <div class="form-label">角色</div>
                <ElInput
                  :ref="setRoleInputRef"
                  v-model="roleInput"
                  class="input role-input"
                  clearable
                  placeholder="请输入角色昵称"
                  @input="parseRoles"
                />
                <div
                  v-if="activeRoleIndex === 0 && activeRoleQuery"
                  class="role-suggestions lineup-suggestions"
                >
                  <div v-if="lineupLoading" class="suggestion-empty">
                    正在查找本月 D 阶段阵容…
                  </div>
                  <button
                    v-for="lineup in lineupSuggestions"
                    :key="`${lineup.team_key}-${lineup.team_id}`"
                    type="button"
                    class="lineup-suggestion"
                    :aria-label="
                      lineup.roles.map((role) => role.nickname).join(' ')
                    "
                    @mousedown.prevent
                    @click="selectLineupSuggestion(lineup)"
                  >
                    <span class="lineup-avatars">
                      <img
                        v-for="role in lineup.roles"
                        :key="role.role_id"
                        :src="role.image_url ?? ''"
                        :alt="role.nickname ?? ''"
                      />
                    </span>
                  </button>
                  <div
                    v-if="!lineupLoading && lineupSuggestions.length === 0"
                    class="suggestion-empty"
                  >
                    没有匹配的本月 D 阶段阵容
                  </div>
                </div>
                <div
                  v-else-if="roleSuggestions.length > 0"
                  class="role-suggestions"
                >
                  <button
                    v-for="role in roleSuggestions"
                    :key="role.id"
                    type="button"
                    class="role-suggestion"
                    @mousedown.prevent
                    @click="selectRoleSuggestion(role)"
                  >
                    <img :src="role.image_url ?? ''" :alt="role.nickname" />
                    <span>{{ role.nickname }}</span>
                  </button>
                </div>
              </div>
              <!-- 角色预览 -->
              <div class="preview-box">
                <div class="preview-title">角色预览</div>
                <div class="preview-roles">
                  <div v-for="index in 5" :key="index" class="preview-role">
                    <template v-if="getCurrentRoleOptionForSlot(index - 1)">
                      <img
                        :src="
                          getCurrentRoleOptionForSlot(index - 1)?.image_url ??
                          ''
                        "
                        :alt="getCurrentRoleOptionForSlot(index - 1)?.nickname"
                        class="preview-role-avatar"
                      />
                      <span>
                        {{ getCurrentRoleForSlot(index - 1) }}
                      </span>
                    </template>
                    <template v-else>
                      <div class="preview-role-avatar empty"></div>
                      <span> &nbsp; </span>
                    </template>
                  </div>
                </div>
              </div>
              <!-- 按钮 -->
              <div class="add-actions">
                <button
                  type="button"
                  class="primary-btn"
                  :disabled="submitLoading"
                  @click="submitAllRecords"
                >
                  提交全部作业
                </button>
                <button
                  type="button"
                  class="plain-btn"
                  :disabled="submitLoading"
                  @click="addNextRecord"
                >
                  添加下一作业
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 52px 0 var(--pcr-space-5);
  background: var(--pcr-bg-surface);
  border-bottom: 1px solid var(--pcr-border);
}

.dialog-title {
  font-size: var(--pcr-font-size-body);
  font-weight: var(--pcr-font-weight-semibold);
  color: var(--pcr-text-primary);
}

.dialog-count {
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}

.dialog-page {
  width: 100%;
  min-height: 100%;
  background: var(--pcr-bg-page);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: var(--pcr-space-4);
  align-items: start;
  padding: var(--pcr-space-4);
}

.card {
  min-width: 0;
  overflow: hidden;
  background: var(--pcr-bg-surface);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-lg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 var(--pcr-space-5);
  border-bottom: 1px solid var(--pcr-border);
}

.card-title {
  font-size: var(--pcr-font-size-body);
  font-weight: var(--pcr-font-weight-semibold);
  color: var(--pcr-text-primary);
}

.card-count {
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}

.card-body {
  padding: var(--pcr-space-5);
}

.add-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: var(--pcr-font-size-small);
  line-height: 18px;
  color: var(--pcr-text-secondary);
}

.add-panel :deep(.input .el-input__wrapper) {
  min-height: 36px;
  padding: 0 11px;
  background: var(--pcr-bg-surface);
  border-radius: var(--pcr-radius-md);
  box-shadow: 0 0 0 1px var(--pcr-border) inset;
}

.add-panel :deep(.input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--pcr-border-strong) inset;
}

.add-panel :deep(.input .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--pcr-color-primary) inset,
    var(--pcr-shadow-focus);
}

.add-panel :deep(.input .el-input__inner) {
  font-size: var(--pcr-font-size-small);
  color: var(--pcr-text-primary);
  caret-color: var(--pcr-color-primary);
}

.add-panel :deep(.input .el-input__inner::placeholder) {
  color: var(--pcr-text-muted);
  opacity: 1;
}

.author-input-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--pcr-danger) inset !important;
}

.link-input-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--pcr-danger) inset !important;
}

.damage-input-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--pcr-danger) inset !important;
}

.input-error-text {
  margin-top: -2px;
  font-size: var(--pcr-font-size-caption);
  line-height: 16px;
  color: var(--pcr-danger);
}

.options {
  display: grid;
  gap: 8px;
}

.stage-options {
  grid-template-columns: repeat(3, 1fr);
}

.boss-options {
  grid-template-columns: repeat(5, 1fr);
}

.difficulty-options {
  grid-template-columns: repeat(5, 1fr);
}

.option-btn {
  height: 34px;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-secondary);
  cursor: pointer;
  background: var(--pcr-bg-surface);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-md);
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.option-btn:hover {
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
  border-color: var(--pcr-color-primary);
}

.option-btn.active {
  font-weight: var(--pcr-font-weight-semibold);
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
  border-color: var(--pcr-color-primary);
}

.damage-row {
  display: flex;
  gap: 0;
  align-items: center;
  width: 100%;
}

.damage-row .input {
  flex: 1;
  width: 100%;
}

.damage-unit {
  display: none;
}

.preview-box {
  padding: 10px 0 2px;
}

.preview-title {
  margin-bottom: 8px;
  font-size: var(--pcr-font-size-small);
  color: var(--pcr-text-secondary);
}

.preview-roles {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: center;
  padding: 4px 0;
}

.preview-role {
  flex: none;
  width: 42px;
  text-align: center;
}

.preview-role-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
  object-fit: cover;
  background: var(--pcr-bg-subtle);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-sm);
}

.preview-role-avatar.empty {
  border-style: dashed;
}

.preview-role span {
  display: none;
}

.add-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 2px;
}

.primary-btn,
.plain-btn {
  height: 40px;
  font-size: var(--pcr-font-size-small);
  font-weight: var(--pcr-font-weight-medium);
  cursor: pointer;
  border-radius: var(--pcr-radius-md);
  transition:
    opacity 0.2s,
    background 0.2s,
    border-color 0.2s;
}

.primary-btn {
  color: var(--pcr-color-primary-foreground);
  background: var(--pcr-color-primary);
  border: 1px solid var(--pcr-color-primary);
}

.primary-btn:hover {
  background: var(--pcr-color-primary-hover);
  border-color: var(--pcr-color-primary-hover);
}

.primary-btn:disabled,
.plain-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.plain-btn {
  color: var(--pcr-text-secondary);
  background: var(--pcr-bg-surface);
  border: 1px solid var(--pcr-border);
}

.plain-btn:hover {
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
  border-color: var(--pcr-color-primary);
}

.lineup-suggestions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  max-height: 320px;
  overflow: auto;
}

.lineup-suggestion {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.lineup-suggestion:hover {
  background: var(--pcr-bg-subtle);
}

.lineup-avatars {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
}

.lineup-avatars img {
  width: 42px;
  height: 42px;
  flex: 0 1 42px;
  object-fit: cover;
  border: 1px solid var(--pcr-bg-surface);
  border-radius: var(--pcr-radius-sm);
}

.suggestion-empty {
  padding: 10px;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}

@media (max-width: 900px) {
  .layout {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .add-card {
    order: 1;
    width: 100%;
  }

  .job-card {
    order: 2;
    width: 100%;
  }

  .card-header {
    height: 50px;
    padding: 0 16px;
  }

  .card-body {
    padding: 12px;
  }

  .add-panel {
    gap: 14px;
  }

  .difficulty-options {
    grid-template-columns: repeat(5, 1fr);
  }

  .option-btn {
    height: 32px;
  }

  .preview-roles {
    gap: 9px;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .layout {
    gap: 8px;
    padding: 8px;
  }

  .card-header {
    height: 46px;
    padding: 0 12px;
  }

  .dialog-header {
    padding: 0 48px 0 12px;
  }

  .card-title {
    font-size: 15px;
  }

  .card-count {
    font-size: 12px;
  }

  .card-body {
    padding: 10px;
  }

  .add-panel {
    gap: 12px;
  }

  .form-item {
    gap: 6px;
  }

  .form-label {
    font-size: 12px;
  }

  .stage-options,
  .boss-options,
  .difficulty-options {
    gap: 6px;
  }

  .option-btn {
    height: 31px;
    font-size: 11px;
  }

  .preview-roles {
    gap: 7px;
  }

  .preview-role {
    width: 40px;
  }

  .preview-role-avatar {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 380px) {
  .card-body {
    padding: 8px;
  }

  .layout {
    padding: 6px;
  }

  .preview-roles {
    gap: 5px;
  }

  .preview-role {
    width: 38px;
  }

  .preview-role-avatar {
    width: 38px;
    height: 38px;
  }
}

.role-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  margin-top: 8px;
  background: var(--pcr-bg-subtle);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-md);
}

.role-suggestion {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 5px;
  color: var(--pcr-text-primary);
  cursor: pointer;
  background: var(--pcr-bg-surface);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-md);
}

.role-suggestion:hover {
  background: var(--pcr-color-primary-soft);
  border-color: var(--pcr-color-primary);
}

.role-suggestion img {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: var(--pcr-radius-sm);
}

.role-suggestion span {
  max-width: 64px;
  font-size: var(--pcr-font-size-caption);
  line-height: 16px;
  text-align: center;
  overflow-wrap: anywhere;
}

.input-help-text {
  margin-top: 5px;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}
</style>

<style>
.team-add-dialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 8vh);
  margin: 4vh auto;
  overflow: hidden;
  background: var(--pcr-bg-surface);
  border: 1px solid var(--pcr-border);
  border-radius: var(--pcr-radius-lg);
  box-shadow: var(--pcr-shadow-overlay);
}

.team-add-dialog .el-dialog__header {
  padding: 0;
  margin-right: 0;
}

.team-add-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow-y: auto;
  background: var(--pcr-bg-page);
}

.team-add-dialog .el-dialog__headerbtn {
  top: 18px;
  right: 18px;
}

.team-add-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--pcr-text-muted);
}

.team-add-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--pcr-text-primary);
}

@media (max-width: 600px) {
  .team-add-dialog {
    max-height: calc(100vh - 4vh);
    margin: 2vh auto;
  }
}
</style>
