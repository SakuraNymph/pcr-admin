<script lang="ts" setup>
import type {
  TeamListItem,
  TeamRoleItem,
  UpdateTeamLinkPayload,
} from '#/api/core/team';

import { computed, reactive, ref, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { updateTeamLinkApi } from '#/api/core/team';

import {
  difficultyOptions,
  getAuthorLength,
  getRoleDamage,
  getStageText,
  isFixedDamageStage,
} from '../team-utils';

const props = defineProps<{
  team: null | TeamListItem;
}>();

const emit = defineEmits<{
  saved: [];
  'update:team': [team: null | TeamListItem];
}>();

const editLoading = ref(false);

const editForm = reactive({
  teamId: 0,
  linkId: 0,
  author: '',
  link: '',
  stage: 2 as number | undefined,
  boss: 1 as number | undefined,
  difficulty: 1 as number | undefined,
  damage: '',
  roles: [] as TeamRoleItem[],
});

const editDialogVisible = computed({
  get: () => props.team !== null,
  set: (visible: boolean) => {
    if (!visible) {
      emit('update:team', null);
    }
  },
});

watch(
  () => props.team,
  (row) => {
    if (!row) {
      return;
    }
    editForm.teamId = row.team_id;
    editForm.linkId = row.link_id;
    editForm.author = row.author ?? '';
    editForm.link = row.link ?? row.url ?? '';
    editForm.stage = Number(row.stage);
    editForm.boss = Number(row.boss);
    editForm.difficulty = Number(row.difficulty);
    editForm.damage = isFixedDamageStage(row.stage)
      ? String(getRoleDamage(row.stage, row.boss) ?? '')
      : String(row.damage ?? '');
    editForm.roles = [...(row.roles ?? [])];
  },
  { immediate: true },
);

function validateEditForm() {
  const author = editForm.author.trim();
  if (!author || !/^[\u4E00-\u9FFFA-Za-z0-9]+$/.test(author)) {
    ElMessage.warning('作者只能输入中文、字母、数字');
    return false;
  }
  if (getAuthorLength(author) > 16) {
    ElMessage.warning('作者长度不能超过16个长度单位，最多8个汉字');
    return false;
  }
  try {
    const url = new URL(editForm.link.trim());
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      throw new Error('invalid URL');
    }
  } catch {
    ElMessage.warning('请输入正确的链接地址');
    return false;
  }
  if (!editForm.difficulty) {
    ElMessage.warning('请选择难度');
    return false;
  }
  if (
    !isFixedDamageStage(editForm.stage) &&
    (!/^\d+$/.test(editForm.damage) ||
      Number(editForm.damage) < 1 ||
      Number(editForm.damage) > 99_999)
  ) {
    ElMessage.warning('伤害范围必须为1～99999');
    return false;
  }
  return true;
}

async function submitEditTeam() {
  if (!validateEditForm()) {
    return;
  }
  const payload: UpdateTeamLinkPayload = {
    author: editForm.author.trim(),
    link: editForm.link.trim(),
    difficulty: Number(editForm.difficulty),
    damage: isFixedDamageStage(editForm.stage)
      ? null
      : Number(editForm.damage),
  };

  editLoading.value = true;
  try {
    await updateTeamLinkApi(editForm.teamId, editForm.linkId, payload);
    ElMessage.success('来源作业修改成功');
    emit('update:team', null);
    emit('saved');
  } catch (error) {
    console.error(error);
  } finally {
    editLoading.value = false;
  }
}
</script>

<template>
  <ElDialog
    v-model="editDialogVisible"
    title="编辑作业"
    width="560px"
    :close-on-click-modal="false"
  >
    <ElForm :model="editForm" label-width="90px">
      <ElFormItem label="作者">
        <ElInput v-model="editForm.author" maxlength="16" />
      </ElFormItem>
      <ElFormItem label="作业链接">
        <ElInput v-model="editForm.link" maxlength="1000" />
      </ElFormItem>
      <ElFormItem label="阶段">
        <span>{{ getStageText(editForm.stage) }}</span>
      </ElFormItem>
      <ElFormItem label="Boss">
        <span>{{ editForm.boss }}王</span>
      </ElFormItem>
      <ElFormItem label="难度">
        <ElSelect v-model="editForm.difficulty" style="width: 100%">
          <ElOption
            v-for="item in difficultyOptions"
            :key="item.value"
            :label="item.label"
            :value="Number(item.value)"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="伤害">
        <ElInput
          v-model="editForm.damage"
          inputmode="numeric"
          :disabled="isFixedDamageStage(editForm.stage)"
          :placeholder="
            isFixedDamageStage(editForm.stage)
              ? `自动伤害 ${getRoleDamage(editForm.stage ?? 0, editForm.boss ?? 0)}`
              : '请输入1-99999的整数'
          "
        />
        <div
          v-if="isFixedDamageStage(editForm.stage)"
          class="input-help-text"
        >
          B/C 阶段伤害由阶段和 Boss 自动计算。
        </div>
      </ElFormItem>
      <ElFormItem label="角色">
        <div class="edit-role-list">
          <span v-for="role in editForm.roles" :key="role.role_id">
            {{ role.nickname }}
          </span>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="editDialogVisible = false">取消</ElButton>
      <ElButton
        type="primary"
        :loading="editLoading"
        @click="submitEditTeam"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.input-help-text {
  margin-top: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.edit-role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.edit-role-list span {
  padding: 3px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
