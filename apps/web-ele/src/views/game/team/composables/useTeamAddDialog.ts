import type { TeamDraftRecord } from '../team-utils';

import type { TeamLineupOption, TeamRoleOption } from '#/api/core/team';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import { ElInput, ElMessage, ElMessageBox } from 'element-plus';

import {
  createTeamApi,
  getDStageLineupOptionsApi,
  getTeamRoleOptionsApi,
} from '#/api/core/team';

import {
  getAuthorLength,
  getDisplayRoleNames,
  getRoleForSlot,
  getRoleInputTokens,
  getRoleOptionByNickname,
  getRoleOptionForSlot,
  isFixedDamageStage,
  stageIdMap,
} from '../team-utils';

interface UseTeamAddDialogOptions {
  onSubmitted: () => void;
}

export function useTeamAddDialog(options: UseTeamAddDialogOptions) {
  const submitLoading = ref(false);

  const addForm = reactive({
    author: '',
    link: '',
    records: [] as TeamDraftRecord[],
  });

  const currentRecord = reactive<TeamDraftRecord>({
    stage: '',
    boss: [],
    difficulty: '',
    damage: '',
    roles: [],
  });

  const roleInput = ref('');

  const roleInputRef = ref<InstanceType<typeof ElInput> | null>(null);

  function setRoleInputRef(instance: unknown) {
    roleInputRef.value = instance as InstanceType<typeof ElInput> | null;
  }

  const roleOptions = ref<TeamRoleOption[]>([]);

  const activeRoleQuery = ref('');

  const lineupSuggestions = ref<TeamLineupOption[]>([]);

  const lineupLoading = ref(false);

  let lineupRequestId = 0;

  const activeRoleIndex = ref(-1);

  const lastValidRoleInput = ref('');

  const authorError = ref('');

  const linkError = ref('');

  const damageError = ref('');

  function findRoleOption(nickname: string) {
    return getRoleOptionByNickname(nickname, roleOptions.value);
  }

  const roleSuggestions = computed(() => {
    const query = activeRoleQuery.value.trim();
    if (
      !query ||
      currentRecord.roles.length === 0 ||
      activeRoleIndex.value === 0
    ) {
      return [];
    }
    if (roleOptions.value.some((role) => role.nickname === query)) {
      return [];
    }
    const effectiveRoles = currentRecord.roles.slice(0, 5);
    const usedRoleNames = new Set(
      activeRoleIndex.value < 5
        ? effectiveRoles.filter(
            (_role, index) => index !== activeRoleIndex.value,
          )
        : [],
    );
    return roleOptions.value
      .filter(
        (role) =>
          role.nickname.startsWith(query) &&
          !usedRoleNames.has(role.nickname),
      )
      .toSorted(
        (a, b) =>
          Number(b.use_times) - Number(a.use_times) ||
          Number(a.id) - Number(b.id),
      );
  });

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

  function handleOpen() {
    addForm.author = '';
    addForm.link = '';
    addForm.records = [];
    resetCurrentRecord();
    if (roleOptions.value.length === 0) {
      void loadRoleOptions();
    }
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

  function selectStage(value: string) {
    currentRecord.stage = value;
    damageError.value = '';
    if (isFixedDamageStage(value)) {
      currentRecord.damage = '';
    }
  }

  function toggleBoss(value: string) {
    const index = currentRecord.boss.indexOf(value);
    if (index === -1) {
      currentRecord.boss.push(value);
    } else {
      currentRecord.boss.splice(index, 1);
    }
  }

  function selectDifficulty(value: string) {
    currentRecord.difficulty = value;
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
    const cursorPosition = Math.max(
      0,
      Math.min(rawCursorPosition, value.length),
    );
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
      if (!findRoleOption(nickname)) {
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
    const roles = lineup.roles
      .map((role) => role.nickname ?? '')
      .filter(Boolean);
    roleInput.value = roles.join(' ');
    lastValidRoleInput.value = roleInput.value;
    currentRecord.roles = roles;
    activeRoleQuery.value = '';
    activeRoleIndex.value = -1;
    lineupSuggestions.value = [];
    await nextTick();
    roleInputRef.value?.focus();
    const inputElement = roleInputRef.value?.$el?.querySelector(
      'input',
    ) as HTMLInputElement | null;
    inputElement?.setSelectionRange(
      roleInput.value.length,
      roleInput.value.length,
    );
  }

  async function selectRoleSuggestion(role: TeamRoleOption) {
    const roles = getRoleInputTokens(roleInput.value);
    const roleIndex = activeRoleIndex.value;

    if (roleIndex < 0 || roleIndex > roles.length) {
      return;
    }

    if (
      roleIndex < 5 &&
      roles
        .slice(0, 5)
        .some(
          (nickname, index) =>
            index !== roleIndex && nickname === role.nickname,
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

  function getCurrentRoleForSlot(slotIndex: number) {
    return getRoleForSlot(
      currentRecord.roles,
      slotIndex,
      roleOptions.value,
    );
  }

  function getCurrentRoleOptionForSlot(slotIndex: number) {
    return getRoleOptionForSlot(
      currentRecord.roles,
      slotIndex,
      roleOptions.value,
    );
  }

  async function copyRecordRoles(record: TeamDraftRecord) {
    const names = getDisplayRoleNames(
      record.roles,
      roleOptions.value,
    ).join(' ');
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
      (nickname) => !findRoleOption(nickname),
    );
    if (invalidRole) {
      ElMessage.warning('请从角色候选中选择正确的角色昵称');
      return false;
    }
    return true;
  }

  function addCurrentRecord() {
    if (!validateCurrentRecord()) {
      return false;
    }
    addForm.records.push({
      stage: currentRecord.stage,
      boss: [...currentRecord.boss],
      difficulty: currentRecord.difficulty,
      damage: currentRecord.damage,
      roles: currentRecord.roles.slice(0, 5),
    });
    return true;
  }

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

  function deleteRecord(index: number) {
    addForm.records.splice(index, 1);
  }

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
          boss: record.boss.map((boss) =>
            Number(boss.replaceAll(/\D/g, '')),
          ),
          difficulty: Number(record.difficulty),
          damage: isFixedDamageStage(record.stage)
            ? null
            : Number(record.damage),
          roles: record.roles
            .map((nickname) => findRoleOption(nickname)?.id)
            .filter((id): id is number => id !== undefined),
        })),
      });
      ElMessage.success('作业添加成功');
      options.onSubmitted();
    } catch (error) {
      console.error(error);
    } finally {
      submitLoading.value = false;
    }
  }

  onMounted(() => {
    void loadRoleOptions();
  });

  return {
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
  };
}
