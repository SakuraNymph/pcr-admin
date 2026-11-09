<script lang="ts" setup>
import type {
  MasterCoinShopOverview,
  MasterCoinShopRoleItem,
  MasterCoinShopSearchRole,
  MasterCoinShopType,
} from '#/api/core/master-coin-shop';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElImage,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElTag,
} from 'element-plus';

import {
  addMasterCoinShopRoleApi,
  getMasterCoinShopOverviewApi,
  removeMasterCoinShopRoleApi,
  searchMasterCoinShopGameRolesApi,
  sortMasterCoinShopGroupApi,
  updateMasterCoinShopRoleTypeApi,
} from '#/api/core/master-coin-shop';

interface ShopGroupView {
  items: MasterCoinShopRoleItem[];
  label: string;
  type: MasterCoinShopType;
}

type TagType = 'danger' | 'info' | 'primary' | 'success' | 'warning';

const { hasAccessByCodes } = useAccess();

const canList = computed(() =>
  hasAccessByCodes(['system:master-coin-shop:list']),
);
const canSearch = computed(() =>
  hasAccessByCodes(['system:master-coin-shop:search']),
);
const canCreate = computed(() =>
  hasAccessByCodes(['system:master-coin-shop:create']),
);
const canUpdate = computed(() =>
  hasAccessByCodes(['system:master-coin-shop:update']),
);
const canSort = computed(() =>
  hasAccessByCodes(['system:master-coin-shop:sort']),
);
const canDelete = computed(() =>
  hasAccessByCodes(['system:master-coin-shop:delete']),
);

const fesRoles = ref<MasterCoinShopRoleItem[]>([]);
const nonFesRoles = ref<MasterCoinShopRoleItem[]>([]);
const overviewLoading = ref(false);

const searchKeyword = ref('');
const lastSearchKeyword = ref('');
const searchResults = ref<MasterCoinShopSearchRole[]>([]);
const searchLoading = ref(false);

const mutating = ref(false);
const activeRoleId = ref<null | number>(null);
const sortingType = ref<MasterCoinShopType | null>(null);
const draggedRoleId = ref<null | number>(null);
const dragSourceType = ref<MasterCoinShopType | null>(null);
const dragOverRoleId = ref<null | number>(null);

const groups = computed<ShopGroupView[]>(() => [
  {
    items: fesRoles.value,
    label: 'FES',
    type: 1,
  },
  {
    items: nonFesRoles.value,
    label: '非 FES',
    type: 2,
  },
]);

const totalRoles = computed(
  () => fesRoles.value.length + nonFesRoles.value.length,
);

function applyOverview(data?: MasterCoinShopOverview | null) {
  fesRoles.value = Array.isArray(data?.fes) ? data.fes : [];
  nonFesRoles.value = Array.isArray(data?.non_fes) ? data.non_fes : [];
}

async function loadOverview() {
  if (!canList.value) {
    fesRoles.value = [];
    nonFesRoles.value = [];
    return;
  }

  overviewLoading.value = true;

  try {
    const data = await getMasterCoinShopOverviewApi();
    applyOverview(data);
  } catch (error) {
    console.error('获取大师币商店配置失败:', error);
  } finally {
    overviewLoading.value = false;
  }
}

async function fetchSearchResults(keyword: string) {
  searchLoading.value = true;

  try {
    const data = await searchMasterCoinShopGameRolesApi(keyword);
    searchResults.value = Array.isArray(data) ? data : [];
    lastSearchKeyword.value = keyword;
  } catch (error) {
    searchResults.value = [];
    lastSearchKeyword.value = keyword;
    console.error('搜索游戏角色失败:', error);
  } finally {
    searchLoading.value = false;
  }
}

async function handleSearch() {
  if (!canSearch.value) {
    return;
  }

  const keyword = searchKeyword.value.trim();

  if (!keyword) {
    ElMessage.warning('请输入角色名称或昵称');
    return;
  }

  await fetchSearchResults(keyword);
}

function clearSearchResults() {
  searchKeyword.value = '';
  lastSearchKeyword.value = '';
  searchResults.value = [];
}

async function refreshAfterMutation() {
  const jobs: Promise<unknown>[] = [loadOverview()];

  if (lastSearchKeyword.value) {
    jobs.push(fetchSearchResults(lastSearchKeyword.value));
  }

  await Promise.allSettled(jobs);
}

async function runMutation(
  gameRoleId: number,
  operation: () => Promise<unknown>,
  successMessage: string,
) {
  if (mutating.value) {
    return;
  }

  mutating.value = true;
  activeRoleId.value = gameRoleId;

  try {
    await operation();
    ElMessage.success(successMessage);
    await refreshAfterMutation();
  } catch (error) {
    console.error('更新大师币商店配置失败:', error);
    await refreshAfterMutation();
  } finally {
    activeRoleId.value = null;
    mutating.value = false;
  }
}

function getGroupRoles(type: MasterCoinShopType) {
  return type === 1 ? fesRoles.value : nonFesRoles.value;
}

function setGroupRoles(
  type: MasterCoinShopType,
  roles: MasterCoinShopRoleItem[],
) {
  if (type === 1) {
    fesRoles.value = roles;
    return;
  }

  nonFesRoles.value = roles;
}

function resetDragState() {
  draggedRoleId.value = null;
  dragSourceType.value = null;
  dragOverRoleId.value = null;
}

function handleDragStart(
  event: DragEvent,
  role: MasterCoinShopRoleItem,
  type: MasterCoinShopType,
) {
  if (
    !canSort.value ||
    mutating.value ||
    getGroupRoles(type).length < 2
  ) {
    event.preventDefault();
    return;
  }

  draggedRoleId.value = role.id;
  dragSourceType.value = type;
  dragOverRoleId.value = role.id;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(role.id));
  }
}

function handleDragOver(
  event: DragEvent,
  role: MasterCoinShopRoleItem,
  type: MasterCoinShopType,
) {
  if (
    !canSort.value ||
    mutating.value ||
    draggedRoleId.value === null ||
    dragSourceType.value !== type ||
    role.id === draggedRoleId.value
  ) {
    return;
  }

  event.preventDefault();
  dragOverRoleId.value = role.id;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

async function persistGroupSort(
  type: MasterCoinShopType,
  roles: MasterCoinShopRoleItem[],
) {
  if (mutating.value) {
    return;
  }

  mutating.value = true;
  sortingType.value = type;

  try {
    const overview = await sortMasterCoinShopGroupApi(
      type,
      roles.map((role) => role.game_role_id),
    );
    applyOverview(overview);
    ElMessage.success(`${getGroupLabel(type)} 分组排序已保存`);
  } catch (error) {
    console.error('保存大师币商店分组排序失败:', error);
    ElMessage.error('排序保存失败，已重新加载服务端配置');
    await loadOverview();
  } finally {
    sortingType.value = null;
    mutating.value = false;
  }
}

function handleDrop(
  event: DragEvent,
  role: MasterCoinShopRoleItem,
  type: MasterCoinShopType,
) {
  event.preventDefault();

  const sourceRoleId = draggedRoleId.value;
  const sourceType = dragSourceType.value;

  resetDragState();

  if (
    sourceRoleId === null ||
    sourceType !== type ||
    mutating.value ||
    !canSort.value
  ) {
    return;
  }

  const currentRoles = [...getGroupRoles(type)];
  const sourceIndex = currentRoles.findIndex(
    (item) => item.id === sourceRoleId,
  );
  const targetIndex = currentRoles.findIndex((item) => item.id === role.id);

  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex === targetIndex
  ) {
    return;
  }

  const [movedRole] = currentRoles.splice(sourceIndex, 1);

  if (!movedRole) {
    return;
  }

  currentRoles.splice(targetIndex, 0, movedRole);
  setGroupRoles(type, currentRoles);
  void persistGroupSort(type, currentRoles);
}

function handleDragEnd() {
  resetDragState();
}

async function handleAdd(
  role: MasterCoinShopSearchRole,
  type: MasterCoinShopType,
) {
  if (!canCreate.value || role.shop_type !== null || mutating.value) {
    return;
  }

  await runMutation(
    role.game_role_id,
    () =>
      addMasterCoinShopRoleApi({
        game_role_id: role.game_role_id,
        type,
      }),
    `已将「${role.nickname}」加入 ${getGroupLabel(type)}`,
  );
}

async function handleMove(
  role: MasterCoinShopRoleItem,
  type: MasterCoinShopType,
) {
  if (!canUpdate.value || role.type === type || mutating.value) {
    return;
  }

  await runMutation(
    role.game_role_id,
    () => updateMasterCoinShopRoleTypeApi(role.game_role_id, type),
    `已将「${role.nickname}」切换至 ${getGroupLabel(type)}`,
  );
}

async function handleRemove(role: MasterCoinShopRoleItem) {
  if (!canDelete.value || mutating.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定将「${role.nickname}」移出大师币商店吗？游戏角色原始资料不会被删除。`,
      '移出确认',
      {
        type: 'warning',
        confirmButtonText: '确定移出',
        cancelButtonText: '取消',
      },
    );
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return;
    }
    return;
  }

  await runMutation(
    role.game_role_id,
    () => removeMasterCoinShopRoleApi(role.game_role_id),
    `已将「${role.nickname}」移出大师币商店`,
  );
}

function getGroupLabel(type: MasterCoinShopType) {
  return type === 1 ? 'FES' : '非 FES';
}

function getElementLabel(value: number) {
  const labels: Record<number, string> = {
    1: '火',
    2: '水',
    3: '风',
    4: '光',
    5: '暗',
  };

  return labels[value] ?? String(value);
}

function getElementTagType(value: number): TagType {
  const types: Record<number, TagType> = {
    1: 'danger',
    2: 'primary',
    3: 'success',
    4: 'warning',
    5: 'info',
  };

  return types[value] ?? 'info';
}

function getAtkTypeLabel(value: number) {
  const labels: Record<number, string> = {
    [-1]: '魔法',
    0: '辅助',
    1: '物理',
  };

  return labels[value] ?? String(value);
}

function getPositionLabel(value: number) {
  const labels: Record<number, string> = {
    1: '前卫',
    2: '中卫',
    3: '后卫',
  };

  return labels[value] ?? String(value);
}

onMounted(() => {
  void loadOverview();
});
</script>

<template>
  <div class="master-coin-shop-page">
    <section class="page-hero">
      <div class="hero-copy">
        <div class="hero-kicker">MASTER COIN SHOP</div>
        <h1>大师币商店角色配置</h1>
        <p>
          搜索现有游戏角色并维护 FES 与非 FES 两个独立分组。最新加入的角色会排在目标分组首位。
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-item stat-fes">
          <span>FES</span>
          <strong>{{ fesRoles.length }}</strong>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-non-fes">
          <span>非 FES</span>
          <strong>{{ nonFesRoles.length }}</strong>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span>商店角色</span>
          <strong>{{ totalRoles }}</strong>
        </div>
      </div>
    </section>

    <ElCard shadow="never" class="search-card">
      <div class="search-heading">
        <div>
          <div class="section-kicker">CHARACTER SEARCH</div>
          <h2>搜索角色</h2>
        </div>
        <span class="search-hint">支持角色名称与昵称</span>
      </div>

      <div class="search-row">
        <ElInput
          v-model="searchKeyword"
          :disabled="!canSearch || mutating"
          clearable
          placeholder="输入角色名称或昵称，例如：凯露"
          @clear="clearSearchResults"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <span class="search-prefix">⌕</span>
          </template>
        </ElInput>

        <ElButton
          type="primary"
          :disabled="!canSearch || mutating"
          :loading="searchLoading"
          @click="handleSearch"
        >
          搜索角色
        </ElButton>
      </div>

      <div
        v-if="!canSearch"
        class="permission-note"
      >
        当前账号没有角色搜索权限。
      </div>

      <div
        v-if="lastSearchKeyword"
        v-loading="searchLoading"
        class="search-results"
      >
        <div class="result-summary">
          <span>
            “{{ lastSearchKeyword }}”的搜索结果
          </span>
          <strong>{{ searchResults.length }} 个角色</strong>
        </div>

        <div v-if="searchResults.length > 0" class="result-grid">
          <article
            v-for="role in searchResults"
            :key="role.game_role_id"
            class="search-role-card"
            :class="{ 'role-disabled': !role.status }"
          >
            <ElImage
              v-if="role.image_url"
              :src="role.image_url"
              :preview-src-list="[role.image_url]"
              fit="cover"
              preview-teleported
              class="search-role-avatar"
            >
              <template #error>
                <div class="avatar-fallback">?</div>
              </template>
            </ElImage>
            <div v-else class="avatar-fallback search-role-avatar">?</div>

            <div class="search-role-main">
              <div class="role-title-row">
                <span class="role-name">{{ role.name }}</span>
                <ElTag
                  v-if="!role.status"
                  type="danger"
                  effect="plain"
                  size="small"
                >
                  已停用
                </ElTag>
              </div>
              <div class="role-nickname">{{ role.nickname }}</div>

              <div class="role-meta">
                <ElTag
                  :type="getElementTagType(role.element)"
                  effect="dark"
                  size="small"
                >
                  {{ getElementLabel(role.element) }}
                </ElTag>
                <span>{{ getAtkTypeLabel(role.atk_type) }}</span>
                <span>{{ getPositionLabel(role.position) }}</span>
                <span>站位 {{ role.search_area_width }}</span>
              </div>

              <div class="role-action-row">
                <template v-if="role.shop_type !== null">
                  <ElTag type="success" effect="light">
                    已加入 {{ getGroupLabel(role.shop_type) }}
                  </ElTag>
                  <span class="role-action-note">不可重复添加</span>
                </template>

                <template v-else-if="canCreate">
                  <ElButton
                    type="warning"
                    size="small"
                    :disabled="mutating"
                    :loading="activeRoleId === role.game_role_id"
                    @click="handleAdd(role, 1)"
                  >
                    加入 FES
                  </ElButton>
                  <ElButton
                    type="primary"
                    size="small"
                    :disabled="mutating"
                    :loading="activeRoleId === role.game_role_id"
                    @click="handleAdd(role, 2)"
                  >
                    加入非 FES
                  </ElButton>
                </template>

                <ElTag v-else type="info" effect="plain">
                  未加入商店
                </ElTag>
              </div>
            </div>
          </article>
        </div>

        <ElEmpty
          v-else-if="!searchLoading"
          description="没有找到匹配的游戏角色"
          :image-size="72"
        />
      </div>
    </ElCard>

    <div v-if="canList" class="group-grid">
      <ElCard
        v-for="group in groups"
        :key="group.type"
        shadow="never"
        class="group-card"
        :class="group.type === 1 ? 'group-card-fes' : 'group-card-non-fes'"
      >
        <template #header>
          <div class="group-header">
            <div>
              <div class="section-kicker">
                {{ group.type === 1 ? 'FES SHOP' : 'NON-FES SHOP' }}
              </div>
              <div class="group-title-row">
                <h2>{{ group.label }} 分组</h2>
                <span class="group-count">{{ group.items.length }}</span>
              </div>
            </div>
            <div class="group-header-actions">
              <span
                v-if="sortingType === group.type"
                class="drag-hint drag-hint-saving"
              >
                正在保存排序...
              </span>
              <span
                v-else-if="canSort && group.items.length > 1"
                class="drag-hint"
              >
                按住角色拖动排序
              </span>
              <ElTag
                :type="group.type === 1 ? 'warning' : 'primary'"
                effect="dark"
              >
                {{ group.type === 1 ? '限定展示组' : '常规展示组' }}
              </ElTag>
            </div>
          </div>
        </template>

        <div v-loading="overviewLoading" class="group-body">
          <div v-if="group.items.length > 0" class="shop-role-list">
            <article
              v-for="(role, index) in group.items"
              :key="role.id"
              class="shop-role-item"
              :class="{
                'role-disabled': !role.status,
                'role-draggable':
                  canSort && !mutating && group.items.length > 1,
                'role-dragging': draggedRoleId === role.id,
                'role-drag-over':
                  dragOverRoleId === role.id &&
                  draggedRoleId !== null &&
                  draggedRoleId !== role.id,
              }"
              :draggable="canSort && !mutating && group.items.length > 1"
              @dragstart="handleDragStart($event, role, group.type)"
              @dragover="handleDragOver($event, role, group.type)"
              @drop="handleDrop($event, role, group.type)"
              @dragend="handleDragEnd"
            >
              <div class="role-rank">
                {{ String(index + 1).padStart(2, '0') }}
              </div>

              <ElImage
                v-if="role.image_url"
                :src="role.image_url"
                :preview-src-list="[role.image_url]"
                fit="cover"
                preview-teleported
                class="shop-role-avatar"
              >
                <template #error>
                  <div class="avatar-fallback">?</div>
                </template>
              </ElImage>
              <div v-else class="avatar-fallback shop-role-avatar">?</div>

              <div class="shop-role-info">
                <div class="role-title-row">
                  <span class="role-name">{{ role.name }}</span>
                  <ElTag
                    v-if="index === 0"
                    :type="group.type === 1 ? 'warning' : 'primary'"
                    effect="light"
                    size="small"
                  >
                    当前首位
                  </ElTag>
                  <ElTag
                    v-if="!role.status"
                    type="danger"
                    effect="plain"
                    size="small"
                  >
                    已停用
                  </ElTag>
                </div>
                <div class="role-nickname">{{ role.nickname }}</div>
                <div class="role-meta">
                  <ElTag
                    :type="getElementTagType(role.element)"
                    effect="dark"
                    size="small"
                  >
                    {{ getElementLabel(role.element) }}
                  </ElTag>
                  <span>{{ getAtkTypeLabel(role.atk_type) }}</span>
                  <span>{{ getPositionLabel(role.position) }}</span>
                  <span>排序 {{ role.sort_order }}</span>
                </div>
              </div>

              <div class="shop-role-actions">
                <ElButton
                  v-if="canUpdate"
                  size="small"
                  :type="group.type === 1 ? 'primary' : 'warning'"
                  plain
                  :disabled="mutating"
                  :loading="activeRoleId === role.game_role_id"
                  @click="handleMove(role, group.type === 1 ? 2 : 1)"
                >
                  移至{{ group.type === 1 ? '非 FES' : 'FES' }}
                </ElButton>
                <ElButton
                  v-if="canDelete"
                  size="small"
                  type="danger"
                  plain
                  :disabled="mutating"
                  :loading="activeRoleId === role.game_role_id"
                  @click="handleRemove(role)"
                >
                  移出
                </ElButton>
                <span
                  v-if="!canUpdate && !canDelete"
                  class="no-action"
                >
                  无操作权限
                </span>
              </div>
            </article>
          </div>

          <ElEmpty
            v-else-if="!overviewLoading"
            :description="`${group.label} 分组暂无角色`"
            :image-size="88"
          />
        </div>
      </ElCard>
    </div>

    <ElCard v-else shadow="never" class="no-permission-card">
      <ElEmpty description="当前账号没有查看大师币商店配置的权限" />
    </ElCard>
  </div>
</template>

<style scoped>
.master-coin-shop-page {
  --fes-accent: #d97706;
  --fes-soft: #fff7e8;
  --non-fes-accent: #0f766e;
  --non-fes-soft: #ecfdf8;

  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.page-hero {
  position: relative;
  display: flex;
  gap: 24px;
  align-items: flex-end;
  justify-content: space-between;
  padding: 24px 26px;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 10%, rgb(217 119 6 / 18%), transparent 28%),
    radial-gradient(circle at 68% 120%, rgb(15 118 110 / 14%), transparent 34%),
    linear-gradient(
      120deg,
      var(--el-color-primary-light-9),
      var(--el-bg-color) 56%,
      var(--el-fill-color-lighter)
    );
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.page-hero::after {
  position: absolute;
  top: -40px;
  right: 34%;
  width: 130px;
  height: 180px;
  content: '';
  background: repeating-linear-gradient(
    90deg,
    transparent 0 14px,
    rgb(255 255 255 / 24%) 14px 16px
  );
  transform: rotate(28deg);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 720px;
}

.hero-kicker,
.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--el-color-primary);
}

.hero-copy h1 {
  margin: 8px 0 8px;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.15;
  color: var(--el-text-color-primary);
}

.hero-copy p {
  max-width: 680px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.hero-stats {
  position: relative;
  z-index: 1;
  display: flex;
  flex: none;
  align-self: center;
  align-items: center;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  backdrop-filter: blur(8px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 74px;
  text-align: center;
}

.stat-item span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.stat-item strong {
  font-size: 24px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.stat-fes strong {
  color: var(--fes-accent);
}

.stat-non-fes strong {
  color: var(--non-fes-accent);
}

.stat-divider {
  width: 1px;
  height: 34px;
  margin: 0 12px;
  background: var(--el-border-color-lighter);
}

.search-card,
.group-card,
.no-permission-card {
  border-color: var(--el-border-color-lighter);
}

.search-card :deep(.el-card__body) {
  padding: 20px;
}

.search-heading,
.group-header,
.result-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-heading {
  margin-bottom: 16px;
}

.search-heading h2,
.group-title-row h2 {
  margin: 3px 0 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.search-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.search-row :deep(.el-input__wrapper) {
  min-height: 40px;
}

.search-prefix {
  font-size: 20px;
  line-height: 1;
  color: var(--el-text-color-placeholder);
}

.permission-note {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-color-warning);
}

.search-results {
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.result-summary {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.result-summary strong {
  color: var(--el-text-color-primary);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
  max-height: 460px;
  padding-right: 4px;
  overflow: auto;
}

.search-role-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  transition:
    border-color 0.2s,
    transform 0.2s;
}

.search-role-card:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
}

.search-role-avatar,
.shop-role-avatar {
  flex: none;
  overflow: hidden;
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.search-role-avatar {
  width: 64px;
  height: 64px;
}

.shop-role-avatar {
  width: 58px;
  height: 58px;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color);
}

.search-role-main,
.shop-role-info {
  min-width: 0;
  flex: 1;
}

.role-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.role-name {
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-nickname {
  margin-top: 2px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.role-meta :deep(.el-tag--info) {
  --el-tag-bg-color: #722ed1;
  --el-tag-border-color: #722ed1;
  --el-tag-hover-color: #722ed1;
  --el-tag-text-color: #fff;
}

.role-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 30px;
  margin-top: 10px;
}

.role-action-note,
.no-action {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.role-disabled {
  opacity: 0.72;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.group-card {
  overflow: hidden;
}

.group-card :deep(.el-card__header) {
  padding: 17px 20px;
  background: var(--el-fill-color-lighter);
  border-bottom-color: var(--el-border-color-lighter);
}

.group-card :deep(.el-card__body) {
  padding: 0;
}

.group-card-fes {
  border-top: 3px solid var(--fes-accent);
}

.group-card-non-fes {
  border-top: 3px solid var(--non-fes-accent);
}

.group-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.group-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.drag-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.drag-hint-saving {
  color: var(--el-color-primary);
}

.group-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 7px;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
}

.group-body {
  min-height: 180px;
}

.shop-role-list {
  display: flex;
  flex-direction: column;
}

.shop-role-item {
  display: grid;
  grid-template-columns: 34px 58px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.2s;
}

.shop-role-item:last-child {
  border-bottom: 0;
}

.shop-role-item:hover {
  background: var(--el-fill-color-lighter);
}

.shop-role-item.role-draggable {
  cursor: grab;
  user-select: none;
}

.shop-role-item.role-draggable:active {
  cursor: grabbing;
}

.shop-role-avatar :deep(img) {
  -webkit-user-drag: none;
}

.shop-role-item.role-dragging {
  opacity: 0.48;
}

.shop-role-item.role-drag-over {
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 2px 0 var(--el-color-primary);
}

.role-rank {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-placeholder);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.group-card-fes .shop-role-item:first-child .role-rank {
  color: var(--fes-accent);
}

.group-card-non-fes .shop-role-item:first-child .role-rank {
  color: var(--non-fes-accent);
}

.shop-role-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}

.shop-role-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.no-permission-card :deep(.el-card__body) {
  padding: 40px 20px;
}

@media (max-width: 1100px) {
  .page-hero {
    align-items: flex-start;
  }

  .hero-stats {
    padding: 10px 12px;
  }

  .stat-item {
    min-width: 64px;
  }

  .stat-divider {
    margin: 0 8px;
  }
}

@media (max-width: 900px) {
  .page-hero {
    flex-direction: column;
  }

  .hero-stats {
    width: 100%;
    justify-content: center;
  }

  .group-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .master-coin-shop-page {
    gap: 12px;
    padding: 8px;
  }

  .page-hero {
    padding: 20px 16px;
    border-radius: 10px;
  }

  .hero-copy h1 {
    font-size: 24px;
  }

  .hero-stats {
    justify-content: space-between;
  }

  .stat-item {
    min-width: 0;
    flex: 1;
  }

  .stat-divider {
    margin: 0 6px;
  }

  .search-card :deep(.el-card__body) {
    padding: 14px;
  }

  .search-heading {
    align-items: flex-start;
  }

  .search-hint {
    max-width: 110px;
    text-align: right;
  }

  .search-row {
    grid-template-columns: 1fr;
  }

  .result-grid {
    grid-template-columns: 1fr;
    max-height: 520px;
  }

  .group-card :deep(.el-card__header) {
    padding: 14px;
  }

  .group-header {
    align-items: flex-start;
    gap: 10px;
  }

  .group-header-actions {
    flex-direction: column;
    align-items: flex-end;
  }

  .shop-role-item {
    grid-template-columns: 28px 52px minmax(0, 1fr);
    gap: 9px;
    padding: 12px;
  }

  .shop-role-avatar {
    width: 52px;
    height: 52px;
  }

  .shop-role-actions {
    grid-column: 2 / -1;
    justify-content: flex-start;
    padding-top: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-role-card {
    transition: none;
  }
}
</style>
