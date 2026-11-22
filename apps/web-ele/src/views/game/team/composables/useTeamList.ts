import type { TeamListItem, TeamListParams } from '#/api/core/team';

import { computed, onMounted, reactive, ref } from 'vue';

import { getTeamsApi } from '#/api/core/team';

import { compareLineups, createDefaultTeamFilters } from '../team-utils';

export function useTeamList() {
  const error = ref('');

  const errorStatus = ref<null | number>(null);

  const loading = ref(false);

  const tableData = ref<TeamListItem[]>([]);

  const total = ref(0);

  const page = ref(1);

  const pageSize = ref(20);

  const searchForm = reactive<TeamListParams>(createDefaultTeamFilters());

  const damageSort = ref<-1 | 1>(-1);

  let requestId = 0;

  const displayTableData = computed(() => {
    return [...tableData.value].toSorted(
      (a, b) =>
        Number(b.stage) - Number(a.stage) ||
        Number(a.boss) - Number(b.boss) ||
        compareLineups(a, b) ||
        Number(b.difficulty) - Number(a.difficulty) ||
        (damageSort.value === 1
          ? Number(a.damage) - Number(b.damage)
          : Number(b.damage) - Number(a.damage)) ||
        Number(b.link_id) - Number(a.link_id),
    );
  });

  async function loadData() {
    const currentRequestId = ++requestId;
    loading.value = true;
    error.value = '';
    errorStatus.value = null;
    try {
      const response = await getTeamsApi({
        ...searchForm,
        page: page.value,
        pageSize: pageSize.value,
      });
      if (currentRequestId !== requestId) return;
      tableData.value = response.data;
      total.value = Number(response.total ?? 0);
    } catch (err) {
      if (currentRequestId !== requestId) return;
      console.error(err);
      tableData.value = [];
      total.value = 0;
      const status = Number(
        (err as any)?.response?.status ?? (err as any)?.status ?? 0,
      );
      errorStatus.value = status || null;
      error.value =
        status === 403
          ? '暂无权限查看作业列表'
          : '作业列表加载失败，请稍后重试';
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false;
      }
    }
  }

  function handleSearch() {
    page.value = 1;
    loadData();
  }

  function resetSearch() {
    Object.assign(searchForm, createDefaultTeamFilters());
    damageSort.value = -1;
    page.value = 1;
    loadData();
  }

  function handlePageChange(value: number) {
    page.value = value;
    loadData();
  }

  function handlePageSizeChange(value: number) {
    pageSize.value = value;
    page.value = 1;
    loadData();
  }

  function toggleDamageSort() {
    damageSort.value = damageSort.value === 1 ? -1 : 1;
  }

  onMounted(() => {
    loadData();
  });

  return {
    damageSort,
    displayTableData,
    error,
    errorStatus,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    loadData,
    loading,
    page,
    pageSize,
    resetSearch,
    searchForm,
    tableData,
    toggleDamageSort,
    total,
  };
}
