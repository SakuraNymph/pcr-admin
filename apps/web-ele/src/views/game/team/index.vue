<script lang="ts" setup>
import type { TeamListItem, TeamListParams } from '#/api/core/team';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';

import { ElMessage, ElMessageBox } from 'element-plus';

import { deleteTeamLinkApi, updateTeamLinkStatusApi } from '#/api/core/team';

import TeamAddDialog from './components/TeamAddDialog.vue';
import TeamEditDialog from './components/TeamEditDialog.vue';
import TeamFilters from './components/TeamFilters.vue';
import TeamTable from './components/TeamTable.vue';
import { useTeamList } from './composables/useTeamList';

const { hasAccessByCodes } = useAccess();

const {
  damageSort,
  displayTableData,
  error,
  errorStatus,
  handleSearch,
  loadData,
  loading,
  resetSearch,
  searchForm,
  toggleDamageSort,
  total,
} = useTeamList();

const canList = computed(() => hasAccessByCodes(['system:team:list']));
const canCreate = computed(() => hasAccessByCodes(['system:team:create']));
const canUpdateLink = computed(() =>
  hasAccessByCodes(['system:team-link:update']),
);
const canDeleteLink = computed(() =>
  hasAccessByCodes(['system:team-link:delete']),
);
const canUpdateLinkStatus = computed(() =>
  hasAccessByCodes(['system:team-link:status']),
);

const addDialogVisible = ref(false);

const editingTeam = ref<null | TeamListItem>(null);

function updateFilters(filters: TeamListParams) {
  Object.assign(searchForm, filters);
}

function openAddDialog() {
  addDialogVisible.value = true;
}

function openEditDialog(row: TeamListItem) {
  editingTeam.value = row;
}

async function handleDelete(row: TeamListItem) {
  try {
    await ElMessageBox.confirm(
      '只隐藏当前作者的这条来源链接，可在“隐藏”状态中恢复。',
      '确认隐藏来源作业',
      {
        confirmButtonText: '隐藏',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await deleteTeamLinkApi(row.team_id, row.link_id);
    ElMessage.success('来源作业已隐藏');
    await loadData();
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error(error);
    }
  }
}

async function handleRestore(row: TeamListItem) {
  try {
    await updateTeamLinkStatusApi(row.team_id, row.link_id, 1);
    ElMessage.success('来源作业已恢复');
    await loadData();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="page pcr-page">
    <div v-if="!canList" class="pcr-surface access-panel">
      <span class="pcr-kicker">ACCESS</span>
      <h2 class="pcr-section-title">暂无访问权限</h2>
      <p class="access-description">
        当前账号没有作业列表权限，请联系管理员开通后重试。
      </p>
    </div>

    <template v-else>
      <TeamFilters
        :filters="searchForm"
        @update:filters="updateFilters"
        @search="handleSearch"
        @reset="resetSearch"
      />
      <TeamTable
        :rows="displayTableData"
        :total="total"
        :loading="loading"
        :error="error"
        :error-status="errorStatus"
        :damage-sort="damageSort"
        :can-create="canCreate"
        :can-update-link="canUpdateLink"
        :can-delete-link="canDeleteLink"
        :can-update-link-status="canUpdateLinkStatus"
        @add="openAddDialog"
        @edit="openEditDialog"
        @hide="handleDelete"
        @restore="handleRestore"
        @retry="loadData"
        @toggle-damage-sort="toggleDamageSort"
      />
    </template>

    <TeamAddDialog v-model:visible="addDialogVisible" @submitted="loadData" />
    <TeamEditDialog v-model:team="editingTeam" @saved="loadData" />
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  color: var(--pcr-text-primary);
  background: var(--pcr-bg-page);
}

.access-panel {
  display: flex;
  flex-direction: column;
  gap: var(--pcr-space-2);
  align-items: flex-start;
  padding: var(--pcr-space-7);
}

.access-description {
  margin: 0;
  font-size: var(--pcr-font-size-small);
  line-height: var(--pcr-line-height-body);
  color: var(--pcr-text-secondary);
}

@media (max-width: 600px) {
  .page {
    padding: var(--pcr-space-4);
  }
}
</style>
