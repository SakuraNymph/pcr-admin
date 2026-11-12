import type { TeamListItem, TeamListParams } from '#/api/core/team';

import { computed, onMounted, reactive, ref } from 'vue';

import { getTeamsApi } from '#/api/core/team';

import {
  compareLineups,
  createDefaultTeamFilters,
} from '../team-utils';

export function useTeamList() {
  const loading = ref(false);

  const tableData = ref<TeamListItem[]>([]);

  const total = ref(0);

  const searchForm = reactive<TeamListParams>(createDefaultTeamFilters());

  const damageSort = ref<-1 | 1>(-1);

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
    loading.value = true;
    try {
      const response: any = await getTeamsApi(searchForm as TeamListParams);
      const page = response?.data?.data ? response.data : response;
      if (Array.isArray(page?.data)) {
        tableData.value = page.data;
        total.value = page.data.length;
      } else if (Array.isArray(response?.data)) {
        tableData.value = response.data;
        total.value = response.data.length;
      } else if (Array.isArray(response)) {
        tableData.value = response;
        total.value = response.length;
      } else {
        tableData.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error(error);
      tableData.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    loadData();
  }

  function resetSearch() {
    Object.assign(searchForm, createDefaultTeamFilters());
    damageSort.value = -1;
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
    handleSearch,
    loadData,
    loading,
    resetSearch,
    searchForm,
    tableData,
    toggleDamageSort,
    total,
  };
}
