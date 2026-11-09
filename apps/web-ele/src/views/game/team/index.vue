<script lang="ts" setup>
import type {
  TeamLineupOption,
  TeamListItem,
  TeamListParams,
  TeamRoleItem,
  TeamRoleOption,
  UpdateTeamLinkPayload,
} from '#/api/core/team';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createTeamApi,
  deleteTeamLinkApi,
  getDStageLineupOptionsApi,
  getTeamRoleOptionsApi,
  getTeamsApi,
  updateTeamLinkApi,
  updateTeamLinkStatusApi,
} from '#/api/core/team';

const { hasAccessByCodes } = useAccess();

/* =========================================================
 * 列表
 * ========================================================= */

const loading = ref(false);

const tableData = ref<TeamListItem[]>([]);

const total = ref(0);

const searchForm = reactive<TeamListParams>({
  month: '',
  stage: undefined,
  boss: undefined,
  mode: undefined,
  difficulty: undefined,
  author: '',
  atk_type: undefined,
  status: 1,
});

function compareLineups(a: TeamListItem, b: TeamListItem) {
  const aRoles = a.team_key.split(',').filter(Boolean).map(Number);
  const bRoles = b.team_key.split(',').filter(Boolean).map(Number);
  for (let index = 0; index < Math.max(aRoles.length, bRoles.length); index += 1) {
    const difference = (aRoles[index] ?? 0) - (bRoles[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

const damageSort = ref<-1 | 1>(-1);
const displayTableData = computed(() => {
  return [...tableData.value].toSorted((a, b) =>
    Number(b.stage) - Number(a.stage)
    || Number(a.boss) - Number(b.boss)
    || compareLineups(a, b)
    || Number(b.difficulty) - Number(a.difficulty)
    || (damageSort.value === 1
      ? Number(a.damage) - Number(b.damage)
      : Number(b.damage) - Number(a.damage))
    || Number(b.link_id) - Number(a.link_id),
  );
});

/* =========================================================
 * 添加作业
 * ========================================================= */

interface AddRecord {
  stage: string;
  boss: string[];
  difficulty: string;
  damage: string;
  roles: string[];
}

const addDialogVisible = ref(false);

const submitLoading = ref(false);

const editDialogVisible = ref(false);

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

const addForm = reactive({
  author: '',
  link: '',
  records: [] as AddRecord[],
});

const currentRecord = reactive<AddRecord>({
  stage: '',
  boss: [],
  difficulty: '',
  damage: '',
  roles: [],
});

const roleInput = ref('');

const roleInputRef = ref<InstanceType<typeof ElInput> | null>(null);

const roleOptions = ref<TeamRoleOption[]>([]);

const activeRoleQuery = ref('');
const lineupSuggestions = ref<TeamLineupOption[]>([]);
const lineupLoading = ref(false);
let lineupRequestId = 0;

const activeRoleIndex = ref(-1);

const lastValidRoleInput = ref('');

const roleSuggestions = computed(() => {
  const query = activeRoleQuery.value.trim();
  if (!query || currentRecord.roles.length === 0 || activeRoleIndex.value === 0) {
    return [];
  }
  if (roleOptions.value.some((role) => role.nickname === query)) {
    return [];
  }
  const effectiveRoles = currentRecord.roles.slice(0, 5);
  const usedRoleNames = new Set(
    activeRoleIndex.value < 5
      ? effectiveRoles.filter((_role, index) => index !== activeRoleIndex.value)
      : [],
  );
  return roleOptions.value
    .filter(
      (role) =>
        role.nickname.startsWith(query) && !usedRoleNames.has(role.nickname),
    )
    .toSorted(
      (a, b) =>
        Number(b.use_times) - Number(a.use_times) || Number(a.id) - Number(b.id),
    );
});

const authorError = ref('');

const linkError = ref('');

const damageError = ref('');

/* =========================================================
 * 常量
 * ========================================================= */

const stageOptions = [
  {
    value: 'B',
    label: 'B阶段',
  },
  {
    value: 'C',
    label: 'C阶段',
  },
  {
    value: 'D',
    label: 'D阶段',
  },
];

const bossOptions = ['1王', '2王', '3王', '4王', '5王'];

const bossHealth: Record<number, number[]> = {
  2: [0, 4200, 4800, 5000, 5200, 6000],
  3: [0, 7000, 8000, 9000, 10_000, 12_000],
};

const difficultyOptions = [
  {
    value: '1',
    label: '纯AUTO',
  },
  {
    value: '2',
    label: '简单SET',
  },
  {
    value: '3',
    label: '开关SET',
  },
  {
    value: '4',
    label: '简单目押',
  },
  {
    value: '5',
    label: '目押',
  },
];

const stageClassMap: Record<string, string> = {
  B: 'stage-b',
  C: 'stage-c',
  D: 'stage-d',
};

const difficultyClassMap: Record<string, string> = {
  '1': 'difficulty-auto',
  '2': 'difficulty-simple-set',
  '3': 'difficulty-switch-set',
  '4': 'difficulty-simple-timing',
  '5': 'difficulty-timing',
};

const difficultyTextMap: Record<string, string> = {
  '1': '纯AUTO',
  '2': '简单SET',
  '3': '开关SET',
  '4': '简单目押',
  '5': '目押',
};

const modeTextMap: Record<number, string> = {
  1: '自动',
  2: '手动',
};

const stageIdMap: Record<string, number> = {
  B: 2,
  C: 3,
  D: 4,
};

const stageTextMap: Record<string, string> = {
  '1': 'A',
  '2': 'B',
  '3': 'C',
  '4': 'D',
  '5': 'E',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
};

/* =========================================================
 * 页面显示辅助
 * ========================================================= */

function getStageClass(value: unknown) {
  const stage = stageTextMap[String(value)] ?? String(value);
  return stageClassMap[stage] ?? '';
}

function getStageText(value: unknown) {
  const stage = stageTextMap[String(value)];
  return stage ? `${stage}阶段` : '-';
}

function getDifficultyClass(value: unknown) {
  return difficultyClassMap[String(value)] ?? '';
}

function getDifficultyText(value: unknown) {
  return difficultyTextMap[String(value)] ?? '-';
}

function getModeText(value: unknown) {
  return modeTextMap[Number(value)] ?? '-';
}

function formatDamage(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

function formatDateTime(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getTeamRoles(row: TeamListItem): TeamRoleItem[] {
  const roles = row.roles ?? [];
  return [...roles]
    .toSorted(
      (a, b) =>
        Number(b.search_area_width ?? 0) - Number(a.search_area_width ?? 0) ||
        Number(a.role_id) - Number(b.role_id),
    );
}

function getTableRoleForSlot(row: TeamListItem, slotIndex: number) {
  const roles = getTeamRoles(row);
  const firstRoleSlot = 5 - roles.length;
  return slotIndex < firstRoleSlot ? undefined : roles[slotIndex - firstRoleSlot];
}

function getTeamAuthor(row: TeamListItem) {
  return row.author || '-';
}

function getTeamLink(row: TeamListItem) {
  return row.link || row.url || '';
}

function getTeamDifficulty(row: TeamListItem) {
  return row.difficulty;
}

function getBossText(row: TeamListItem) {
  const boss = row.boss;
  if (boss === null || boss === undefined) {
    return '-';
  }
  return `${boss}王`;
}

function getDisplayRoleNames(roles: string[]) {
  return roles
    .map((nickname) => getRoleOptionByNickname(nickname))
    .filter((role): role is TeamRoleOption => role !== undefined)
    .toSorted(
      (a, b) =>
        Number(b.search_area_width) - Number(a.search_area_width) ||
        Number(a.id) - Number(b.id),
    )
    .map((role) => role.nickname);
}

function getRoleDamage(stage: number | string, boss: number | string) {
  const stageId = stageIdMap[String(stage)] ?? Number(stage);
  const bossId = Number(String(boss).replaceAll(/\D/g, ''));
  return bossHealth[stageId]?.[bossId];
}

function isFixedDamageStage(stage: number | string | undefined) {
  const stageId = stageIdMap[String(stage)] ?? Number(stage);
  return stageId === 2 || stageId === 3;
}

function getRecordDamageText(record: AddRecord) {
  if (!isFixedDamageStage(record.stage)) {
    return record.damage || '-';
  }
  return '按Boss自动';
}

/* =========================================================
 * 列表
 * ========================================================= */

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
  searchForm.month = '';
  searchForm.stage = undefined;
  searchForm.boss = undefined;
  searchForm.mode = undefined;
  searchForm.difficulty = undefined;
  searchForm.author = '';
  searchForm.atk_type = undefined;
  searchForm.status = 1;
  damageSort.value = -1;
  loadData();
}

function toggleDamageSort() {
  damageSort.value = damageSort.value === 1 ? -1 : 1;
}

/* =========================================================
 * 添加作业弹窗
 * ========================================================= */

function resetCurrentRecord() {
  currentRecord.stage = '';
  currentRecord.boss = [];
  currentRecord.difficulty = '';
  currentRecord.damage = '';
  currentRecord.roles = [];
  roleInput.value = '';
  lastValidRoleInput.value = '';
  activeRoleQuery.value = '';
  activeRoleIndex.value = -1;
  authorError.value = '';
  linkError.value = '';
  damageError.value = '';
}

function resetNextRecord() {
  currentRecord.damage = '';
  damageError.value = '';
}

function openAddDialog() {
  addForm.author = '';
  addForm.link = '';
  addForm.records = [];
  resetCurrentRecord();
  addDialogVisible.value = true;
  if (roleOptions.value.length === 0) {
    void loadRoleOptions();
  }
}

/* =========================================================
 * 作者
 * ========================================================= */
/**
 * 中文字符按2个长度单位计算。
 * 英文和数字按1个长度单位计算。
 * 总长度最大16个单位。
 *
 * 这里只负责检查，不修改输入内容。
 */

function getAuthorLength(value: string) {
  return [...value].reduce(
    (length, char) => length + (/^[\u4E00-\u9FFF]$/.test(char) ? 2 : 1),
    0,
  );
}

function validateAuthor() {
  const author = addForm.author.trim();
  if (!author) {
    authorError.value = '请输入作者';
    return false;
  }
  if (!/^[\u4E00-\u9FFFA-Za-z0-9]+$/.test(author)) {
    authorError.value = '作者只能输入中文、字母、数字';
    return false;
  }
  if (getAuthorLength(author) > 16) {
    authorError.value = '作者长度不能超过16个长度单位，最多8个汉字';
    return false;
  }
  authorError.value = '';
  return true;
}

function handleAuthorInput() {
  validateAuthor();
}

function handleAuthorBlur() {
  validateAuthor();
}

/* =========================================================
 * 链接
 * ========================================================= */

function handleLinkInput(value: string) {
  addForm.link = String(value ?? '');
  linkError.value = '';
}

function validateLink() {
  const link = addForm.link.trim();
  if (!link) {
    linkError.value = '请输入作业链接';
    return false;
  }
  try {
    const url = new URL(link);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      linkError.value = '请输入正确的链接地址';
      return false;
    }
    if (!url.hostname) {
      linkError.value = '请输入正确的链接地址';
      return false;
    }
  } catch {
    linkError.value = '请输入正确的链接地址';
    return false;
  }
  linkError.value = '';
  return true;
}

function handleLinkBlur() {
  if (addForm.link.trim()) {
    validateLink();
  }
}

/* =========================================================
 * 伤害
 * ========================================================= */

function handleDamageInput(value: number | string) {
  currentRecord.damage = String(value ?? '');
  if (isFixedDamageStage(currentRecord.stage)) {
    damageError.value = '';
    return;
  }
  if (!currentRecord.damage) {
    damageError.value = '';
    return;
  }
  if (!/^\d+$/.test(currentRecord.damage)) {
    damageError.value = '伤害必须是1～99999的整数';
    return;
  }
  const damageValue = Number(currentRecord.damage);
  if (damageValue < 1 || damageValue > 99_999) {
    damageError.value = '伤害范围必须为1～99999';
    return;
  }
  damageError.value = '';
}

function handleDamageBlur() {
  if (!isFixedDamageStage(currentRecord.stage) && currentRecord.damage.trim()) {
    validateDamage();
  }
}

function validateDamage() {
  if (isFixedDamageStage(currentRecord.stage)) {
    damageError.value = '';
    return true;
  }
  const damage = currentRecord.damage.trim();
  if (!damage) {
    damageError.value = '请输入伤害';
    ElMessage.warning('请输入伤害');
    return false;
  }
  if (!/^\d+$/.test(damage)) {
    damageError.value = '伤害必须是1～99999的整数';
    ElMessage.warning('伤害必须是1～99999的整数');
    return false;
  }
  const damageValue = Number(damage);
  if (damageValue < 1 || damageValue > 99_999) {
    damageError.value = '伤害范围必须为1～99999';
    ElMessage.warning('伤害范围必须为1～99999');
    return false;
  }
  damageError.value = '';
  return true;
}

/* =========================================================
 * 作者 + 链接验证
 * ========================================================= */

function validateAuthorAndLink() {
  if (!validateAuthor()) {
    ElMessage.warning(authorError.value);
    return false;
  }
  if (!validateLink()) {
    ElMessage.warning(linkError.value);
    return false;
  }
  return true;
}

/* =========================================================
 * 阶段
 * ========================================================= */

function selectStage(value: string) {
  currentRecord.stage = value;
  damageError.value = '';
  if (isFixedDamageStage(value)) {
    currentRecord.damage = '';
  }
}

/* =========================================================
 * Boss
 * ========================================================= */

function toggleBoss(value: string) {
  const index = currentRecord.boss.indexOf(value);
  if (index === -1) {
    currentRecord.boss.push(value);
  } else {
    currentRecord.boss.splice(index, 1);
  }
}

/* =========================================================
 * 难度
 * ========================================================= */

function selectDifficulty(value: string) {
  currentRecord.difficulty = value;
}

/* =========================================================
 * 角色
 * ========================================================= */

function getRoleInputTokens(value: string) {
  return value
    .trim()
    .split(/[\s,，、|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRoleOptionByNickname(nickname: string) {
  if (!nickname) {
    return undefined;
  }
  return roleOptions.value.find((role) => role.nickname === nickname);
}

/**
 * 根据光标所在位置确定当前正在编辑的昵称。
 * 这样编辑或删除中间的角色时，不会错误地把最后一个昵称当作当前输入项。
 */
function syncActiveRoleContext(value: string) {
  const inputElement = roleInputRef.value?.$el?.querySelector(
    'input',
  ) as HTMLInputElement | null;
  const rawCursorPosition = inputElement?.selectionStart ?? value.length;
  const cursorPosition = Math.max(0, Math.min(rawCursorPosition, value.length));
  const tokenPattern = /[^\s,，、|]+/g;
  let match: null | RegExpExecArray;
  let tokenIndex = 0;

  while ((match = tokenPattern.exec(value)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    if (cursorPosition >= start && cursorPosition <= end) {
      activeRoleIndex.value = tokenIndex;
      activeRoleQuery.value = match[0];
      return;
    }

    if (cursorPosition < start) {
      activeRoleIndex.value = tokenIndex;
      activeRoleQuery.value = '';
      return;
    }

    tokenIndex += 1;
  }

  activeRoleIndex.value = tokenIndex;
  activeRoleQuery.value = '';
}

function parseRoles(value?: string) {
  const inputValue = String(value ?? roleInput.value ?? '');
  const roles = getRoleInputTokens(inputValue);

  // 只拦截已经存在于角色选项中的完整昵称，避免中文输入法输入过程中的半成品被误判。
  const seenRoleNames = new Set<string>();
  const duplicatedRole = roles.slice(0, 5).find((nickname) => {
    if (!getRoleOptionByNickname(nickname)) {
      return false;
    }
    if (seenRoleNames.has(nickname)) {
      return true;
    }
    seenRoleNames.add(nickname);
    return false;
  });

  if (duplicatedRole) {
    ElMessage.warning('同一个作业中不能重复选择相同角色');
    roleInput.value = lastValidRoleInput.value;
    currentRecord.roles = getRoleInputTokens(lastValidRoleInput.value);
    void nextTick(() => syncActiveRoleContext(roleInput.value));
    return;
  }

  lastValidRoleInput.value = inputValue;
  currentRecord.roles = roles;
  syncActiveRoleContext(inputValue);
  const roleIndex = activeRoleIndex.value;
  const query = activeRoleQuery.value.trim();
  if (roleIndex === 0 && query) {
    void loadLineupSuggestions(query);
  } else {
    lineupSuggestions.value = [];
  }
}

async function loadLineupSuggestions(prefix: string) {
  const requestId = ++lineupRequestId;
  lineupLoading.value = true;
  try {
    const response: any = await getDStageLineupOptionsApi(prefix);
    if (requestId !== lineupRequestId) return;
    const raw = response?.data?.data ?? response?.data ?? response;
    const data = Array.isArray(raw) ? raw : [];
    lineupSuggestions.value = data;
  } catch (error) {
    if (requestId === lineupRequestId) lineupSuggestions.value = [];
    console.error(error);
  } finally {
    if (requestId === lineupRequestId) lineupLoading.value = false;
  }
}

async function selectLineupSuggestion(lineup: TeamLineupOption) {
  const roles = lineup.roles.map((role) => role.nickname ?? '').filter(Boolean);
  roleInput.value = roles.join(' ');
  lastValidRoleInput.value = roleInput.value;
  currentRecord.roles = roles;
  activeRoleQuery.value = '';
  activeRoleIndex.value = -1;
  lineupSuggestions.value = [];
  await nextTick();
  roleInputRef.value?.focus();
  const inputElement = roleInputRef.value?.$el?.querySelector('input') as HTMLInputElement | null;
  inputElement?.setSelectionRange(roleInput.value.length, roleInput.value.length);
}

function getRoleOptionForSlot(roles: string[], slotIndex: number) {
  const nickname = getRoleForSlot(roles, slotIndex);
  return getRoleOptionByNickname(nickname);
}

async function selectRoleSuggestion(role: TeamRoleOption) {
  const roles = getRoleInputTokens(roleInput.value);
  const roleIndex = activeRoleIndex.value;

  if (roleIndex < 0 || roleIndex > roles.length) {
    return;
  }

  if (
    roleIndex < 5 &&
    roles.slice(0, 5).some(
      (nickname, index) => index !== roleIndex && nickname === role.nickname,
    )
  ) {
    ElMessage.warning('同一个作业中不能重复选择相同角色');
    return;
  }

  if (roleIndex === roles.length) {
    roles.push(role.nickname);
  } else {
    roles[roleIndex] = role.nickname;
  }

  roleInput.value = roles.join(' ');
  lastValidRoleInput.value = roleInput.value;
  currentRecord.roles = [...roles];
  lineupSuggestions.value = [];
  activeRoleQuery.value = '';
  activeRoleIndex.value = -1;

  await nextTick();
  roleInputRef.value?.focus();
  const inputElement = roleInputRef.value?.$el?.querySelector(
    'input',
  ) as HTMLInputElement | null;
  const cursorPosition = roleInput.value.length;
  inputElement?.setSelectionRange(cursorPosition, cursorPosition);
}

async function loadRoleOptions() {
  try {
    const response: any = await getTeamRoleOptionsApi();
    const raw = response?.data?.data ?? response?.data ?? response;
    const data = Array.isArray(raw) ? raw : [];
    roleOptions.value = data
      .filter((item: any) => item && item.nickname)
      .map((item: any) => ({
        id: Number(item.id),
        nickname: String(item.nickname),
        image_url: String(item.image_url ?? ''),
        search_area_width: Number(item.search_area_width ?? 0),
        use_times: Number(item.use_times ?? 0),
      }));
  } catch (error) {
    console.error(error);
  }
}

function getRoleForSlot(roles: string[], slotIndex: number) {
  const orderedRoles = getDisplayRoleNames(roles.slice(0, 5));
  const startIndex = 5 - orderedRoles.length;
  const roleIndex = slotIndex - startIndex;
  if (roleIndex < 0) {
    return '';
  }
  return orderedRoles[roleIndex] ?? '';
}

async function copyRecordRoles(record: AddRecord) {
  const names = getDisplayRoleNames(record.roles).join(' ');
  if (!names) {
    ElMessage.warning('当前作业没有可复制的角色');
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(names);
    } else {
      const input = document.createElement('textarea');
      input.value = names;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    ElMessage.success('角色昵称已复制');
  } catch {
    ElMessage.error('复制失败，请检查浏览器剪贴板权限');
  }
}

/* =========================================================
 * 当前作业验证
 * ========================================================= */

function validateCurrentRecord() {
  if (!currentRecord.stage) {
    ElMessage.warning('请选择阶段');
    return false;
  }
  if (currentRecord.boss.length === 0) {
    ElMessage.warning('请选择Boss');
    return false;
  }
  if (!currentRecord.difficulty) {
    ElMessage.warning('请选择难度');
    return false;
  }
  if (!isFixedDamageStage(currentRecord.stage) && !validateDamage()) {
    return false;
  }
  const effectiveRoles = currentRecord.roles.slice(0, 5);
  if (effectiveRoles.length === 0) {
    ElMessage.warning('请输入至少1个角色昵称');
    return false;
  }
  const duplicateRole = effectiveRoles.find(
    (nickname, index) => effectiveRoles.indexOf(nickname) !== index,
  );
  if (duplicateRole) {
    ElMessage.warning('同一个作业中不能重复选择相同角色');
    return false;
  }
  const invalidRole = effectiveRoles.find(
    (nickname) => !getRoleOptionByNickname(nickname),
  );
  if (invalidRole) {
    ElMessage.warning('请从角色候选中选择正确的角色昵称');
    return false;
  }
  return true;
}

/* =========================================================
 * 添加当前作业
 * ========================================================= */

function addCurrentRecord() {
  if (!validateCurrentRecord()) {
    return false;
  }
  addForm.records.push({
    stage: currentRecord.stage,
    boss: [...currentRecord.boss],
    difficulty: currentRecord.difficulty,
    damage: currentRecord.damage,
    roles: [...currentRecord.roles.slice(0, 5)],
  });
  return true;
}

/* =========================================================
 * 添加下一作业
 * ========================================================= */

function addNextRecord() {
  if (!validateAuthorAndLink()) {
    return;
  }
  if (!addCurrentRecord()) {
    return;
  }
  resetNextRecord();
  ElMessage.success('作业已添加');
}

/* =========================================================
 * 编辑待提交作业
 * ========================================================= */

function editRecord(index: number) {
  const record = addForm.records[index];
  if (!record) {
    return;
  }
  currentRecord.stage = record.stage;
  currentRecord.boss = [...record.boss];
  currentRecord.difficulty = record.difficulty;
  currentRecord.damage = record.damage;
  currentRecord.roles = [...record.roles];
  roleInput.value = record.roles.join(' ');
  lastValidRoleInput.value = roleInput.value;
  activeRoleQuery.value = '';
  activeRoleIndex.value = -1;
  addForm.records.splice(index, 1);
}

/* =========================================================
 * 删除待提交作业
 * ========================================================= */

function deleteRecord(index: number) {
  addForm.records.splice(index, 1);
}

/* =========================================================
 * 提交全部作业
 * ========================================================= */

async function submitAllRecords() {
  if (addForm.records.length === 0) {
    ElMessage.warning('请先将作业添加到左侧列表');
    return;
  }
  if (!validateAuthorAndLink()) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `本次只提交左侧已添加的 ${addForm.records.length} 条作业，右侧尚未添加的内容不会提交。是否继续？`,
      '确认提交',
      {
        confirmButtonText: '确认提交',
        cancelButtonText: '继续编辑',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  submitLoading.value = true;
  try {
    await createTeamApi({
      author: addForm.author.trim(),
      link: addForm.link.trim(),
      records: addForm.records.map((record) => ({
        stage: stageIdMap[record.stage] ?? Number(record.stage),
        boss: record.boss.map((boss) => Number(boss.replaceAll(/\D/g, ''))),
        difficulty: Number(record.difficulty),
        damage: isFixedDamageStage(record.stage)
          ? null
          : Number(record.damage),
        roles: record.roles
          .map((nickname) => getRoleOptionByNickname(nickname)?.id)
          .filter((id): id is number => id !== undefined),
      })),
    });
    ElMessage.success('作业添加成功');
    addDialogVisible.value = false;
    await loadData();
  } catch (error) {
    console.error(error);
  } finally {
    submitLoading.value = false;
  }
}

/* =========================================================
 * 编辑 / 删除
 * ========================================================= */

function handleEdit(row: TeamListItem) {
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
  editDialogVisible.value = true;
}

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
  if (!isFixedDamageStage(editForm.stage) && (
    !/^\d+$/.test(editForm.damage) ||
    Number(editForm.damage) < 1 ||
    Number(editForm.damage) > 99_999
  )) {
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
    editDialogVisible.value = false;
    await loadData();
  } catch (error) {
    console.error(error);
  } finally {
    editLoading.value = false;
  }
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

onMounted(() => {
  loadData();
  void loadRoleOptions();
});
</script>
<template>
  <div class="page">
    <ElCard
      v-if="hasAccessByCodes(['system:team:list'])"
      class="search-card"
      shadow="never"
    >
      <ElForm :model="searchForm" label-width="70px">
        <div class="search-grid">
          <ElFormItem label="月份">
            <ElDatePicker
              v-model="searchForm.month"
              type="month"
              value-format="YYYY-MM"
              clearable
              placeholder="选择月份"
              style="width: 100%"
              @change="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="阶段">
            <ElSelect
              v-model="searchForm.stage"
              clearable
              placeholder="全部阶段"
              style="width: 100%"
            >
              <ElOption label="B阶段" :value="2" />
              <ElOption label="C阶段" :value="3" />
              <ElOption label="D阶段" :value="4" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="BOSS">
            <ElSelect
              v-model="searchForm.boss"
              clearable
              placeholder="全部BOSS"
              style="width: 100%"
            >
              <ElOption
                v-for="boss in [1, 2, 3, 4, 5]"
                :key="boss"
                :label="`${boss}王`"
                :value="boss"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="模式">
            <ElSelect
              v-model="searchForm.mode"
              clearable
              placeholder="全部模式"
              style="width: 100%"
            >
              <ElOption label="手动" :value="2" />
              <ElOption label="自动" :value="1" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="作者">
            <ElInput
              v-model="searchForm.author"
              clearable
              placeholder="作者"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="攻击">
            <ElSelect
              v-model="searchForm.atk_type"
              clearable
              placeholder="全部"
              style="width: 100%"
            >
              <ElOption label="物理" :value="1" />
              <ElOption label="魔法" :value="-1" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="难度">
            <ElSelect
              v-model="searchForm.difficulty"
              clearable
              placeholder="全部难度"
              style="width: 100%"
            >
              <ElOption
                v-for="item in difficultyOptions"
                :key="item.value"
                :label="item.label"
                :value="Number(item.value)"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSelect
              v-model="searchForm.status"
              clearable
              placeholder="全部状态"
              style="width: 100%"
            >
              <ElOption label="显示" :value="1" />
              <ElOption label="隐藏" :value="0" />
            </ElSelect>
          </ElFormItem>
        </div>
        <div class="search-actions">
          <ElButton @click="resetSearch"> 重置 </ElButton>
          <ElButton type="primary" @click="handleSearch"> 搜索 </ElButton>
        </div>
      </ElForm>
    </ElCard>
    <ElCard
      v-if="hasAccessByCodes(['system:team:list'])"
      class="table-card"
      shadow="never"
    >
      <template #header>
        <div class="table-header">
          <div class="table-header-left">
            <span class="table-title"> 作业列表 </span>
            <span class="table-count"> 共 {{ total }} 条 </span>
          </div>
          <ElButton
            v-if="hasAccessByCodes(['system:team:create'])"
            type="primary"
            @click="openAddDialog"
          >
            新增作业
          </ElButton>
        </div>
      </template>
      <ElTable
        v-loading="loading"
        :data="displayTableData"
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
            <button type="button" class="damage-sort-button" @click="toggleDamageSort">
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
        <ElTableColumn label="角色" min-width="360" align="center" header-align="center">
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
            <span class="table-mode-tag" :class="Number(row.mode) === 1 ? 'mode-auto' : 'mode-manual'">
              {{ getModeText(row.mode) }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="80" align="center">
          <template #default="{ row }">
            <span
              class="table-status-tag"
              :class="Number(row.status) === 1 ? 'status-visible' : 'status-hidden'"
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
          <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <ElButton
                v-if="hasAccessByCodes(['system:team-link:update'])"
                link
                type="primary"
                @click="handleEdit(row)"
              >
                编辑
              </ElButton>
              <ElButton
                v-if="
                  Number(row.status) === 1 &&
                  hasAccessByCodes(['system:team-link:delete'])
                "
                link
                type="danger"
                @click="handleDelete(row)"
              >
                隐藏
              </ElButton>
              <ElButton
                v-else-if="
                  Number(row.status) === 0 &&
                  hasAccessByCodes(['system:team-link:status'])
                "
                link
                type="success"
                @click="handleRestore(row)"
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
    <ElDialog
      v-model="addDialogVisible"
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
              <div v-if="addForm.records.length > 0" class="job-list">
                <div
                  v-for="(record, index) in addForm.records"
                  :key="index"
                  class="job-item"
                >
                  <div class="job-basic">
                    <div class="job-stage">
                      <span
                        class="stage-tag"
                        :class="getStageClass(record.stage)"
                      >
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
                          record.boss.includes(boss) &&
                          isFixedDamageStage(record.stage)
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
                        empty: !getRoleForSlot(record.roles, roleIndex - 1),
                      }"
                    >
                      <img
                        v-if="
                          getRoleOptionByNickname(
                            getRoleForSlot(record.roles, roleIndex - 1),
                          )?.image_url ?? ''
                        "
                        :src="
                          getRoleOptionByNickname(
                            getRoleForSlot(record.roles, roleIndex - 1),
                          )?.image_url ?? ''
                        "
                        :alt="getRoleForSlot(record.roles, roleIndex - 1)"
                        class="role-avatar"
                      />
                      <div
                        v-else-if="getRoleForSlot(record.roles, roleIndex - 1)"
                        class="role-avatar role-avatar-text"
                      >
                        {{
                          getRoleForSlot(record.roles, roleIndex - 1).slice(
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
                      @click="copyRecordRoles(record)"
                    >
                      复制
                    </button>
                    <button
                      type="button"
                      class="action-btn"
                      @click="editRecord(index)"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      class="action-btn delete"
                      @click="deleteRecord(index)"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="job-empty">
                <ElEmpty :image-size="80" description="暂未添加作业" />
              </div>
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
                    ref="roleInputRef"
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
                    <div v-if="lineupLoading" class="suggestion-empty">正在查找本月 D 阶段阵容…</div>
                    <button
                      v-for="lineup in lineupSuggestions"
                      :key="`${lineup.team_key}-${lineup.team_id}`"
                      type="button"
                      class="lineup-suggestion"
                      :aria-label="lineup.roles.map((role) => role.nickname).join(' ')"
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
                    <div v-if="!lineupLoading && lineupSuggestions.length === 0" class="suggestion-empty">没有匹配的本月 D 阶段阵容</div>
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
                      <template
                        v-if="
                          getRoleOptionForSlot(currentRecord.roles, index - 1)
                        "
                      >
                        <img
                          :src="
                            getRoleOptionForSlot(currentRecord.roles, index - 1)
                              ?.image_url ?? ''
                          "
                          :alt="
                            getRoleOptionForSlot(currentRecord.roles, index - 1)
                              ?.nickname
                          "
                          class="preview-role-avatar"
                        />
                        <span>
                          {{ getRoleForSlot(currentRecord.roles, index - 1) }}
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
          <div v-if="isFixedDamageStage(editForm.stage)" class="input-help-text">
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
        <ElButton type="primary" :loading="editLoading" @click="submitEditTeam">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>
<style scoped>
.page {
  min-height: 100%;
  padding: 16px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-page);
}

.search-card {
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
}

.search-card :deep(.el-card__body) {
  padding: 18px 20px 8px;
  background: var(--el-bg-color);
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0 16px;
}

.search-grid :deep(.el-form-item) {
  margin-bottom: 16px;
}

.search-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 8px;
}

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

.mode-auto { background: #529b2e; }
.mode-manual { background: #337ecc; }
.status-visible { background: #337ecc; }
.status-hidden { background: #e45656; }

.damage-sort-button {
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
  font: inherit;
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

.lineup-suggestion:hover { background: var(--el-fill-color-light); }
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
  border: 1px solid var(--el-bg-color);
  border-radius: 4px;
}
.suggestion-empty { padding: 10px; color: var(--el-text-color-secondary); }

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

.team-add-dialog :deep(.el-dialog) {
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.team-add-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin-right: 0;
}

.team-add-dialog :deep(.el-dialog__body) {
  height: calc(100% - 54px);
  padding: 0;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.team-add-dialog :deep(.el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dialog-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dialog-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 16px;
  align-items: start;
  padding: 16px;
}

.card {
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 3%);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.card-body {
  padding: 18px;
}

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
  font-size: 13px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

.add-panel :deep(.input .el-input__wrapper) {
  height: 32px;
  padding: 0 11px;
  background: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.add-panel :deep(.input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
}

.add-panel :deep(.input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.add-panel :deep(.input .el-input__inner) {
  font-size: 13px;
  color: #fff !important;
  caret-color: #fff;
}

.add-panel :deep(.input .el-input__inner::placeholder) {
  color: var(--el-text-color-placeholder) !important;
  opacity: 1;
}

.author-input-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
}

.link-input-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
}

.damage-input-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
}

.input-error-text {
  margin-top: -2px;
  font-size: 12px;
  line-height: 16px;
  color: var(--el-color-danger);
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
  height: 32px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.option-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.option-btn.active {
  color: #fff;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
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
  font-size: 13px;
  color: var(--el-text-color-secondary);
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
  font-size: 12px;
  color: var(--el-text-color-secondary);
  object-fit: cover;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
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
  height: 34px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition:
    opacity 0.2s,
    background 0.2s,
    border-color 0.2s;
}

.primary-btn {
  color: #fff;
  background: var(--el-color-primary);
  border: 1px solid var(--el-color-primary);
}

.primary-btn:hover {
  opacity: 0.9;
}

.primary-btn:disabled,
.plain-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.plain-btn {
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
}

.plain-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

@media (max-width: 1100px) {
  .search-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
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
  .page {
    padding: 8px;
  }

  .search-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .layout {
    gap: 8px;
    padding: 8px;
  }

  .card-header {
    height: 46px;
    padding: 0 12px;
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
  .page {
    padding: 6px;
  }

  .search-grid {
    grid-template-columns: 1fr;
  }

  .card-body {
    padding: 8px;
  }

  .layout {
    padding: 6px;
  }

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
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 5px;
}

.role-suggestion {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 5px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 5px;
}

.role-suggestion:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary);
}

.role-suggestion img {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 4px;
}

.role-suggestion span {
  max-width: 64px;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  overflow-wrap: anywhere;
}

.table-role-list {
  justify-content: center;
  width: 100%;
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
