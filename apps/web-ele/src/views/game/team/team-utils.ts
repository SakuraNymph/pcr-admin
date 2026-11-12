import type {
  TeamListItem,
  TeamListParams,
  TeamRoleItem,
  TeamRoleOption,
} from '#/api/core/team';

export interface TeamDraftRecord {
  boss: string[];
  damage: string;
  difficulty: string;
  roles: string[];
  stage: string;
}

export const stageOptions = [
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

export const bossOptions = ['1王', '2王', '3王', '4王', '5王'];

export const bossHealth: Record<number, number[]> = {
  2: [0, 4200, 4800, 5000, 5200, 6000],
  3: [0, 7000, 8000, 9000, 10_000, 12_000],
};

export const difficultyOptions = [
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

export const stageIdMap: Record<string, number> = {
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

export function createDefaultTeamFilters(): TeamListParams {
  return {
    month: '',
    stage: undefined,
    boss: undefined,
    mode: undefined,
    difficulty: undefined,
    author: '',
    atk_type: undefined,
    status: 1,
  };
}

export function compareLineups(a: TeamListItem, b: TeamListItem) {
  const aRoles = a.team_key.split(',').filter(Boolean).map(Number);
  const bRoles = b.team_key.split(',').filter(Boolean).map(Number);

  for (let index = 0; index < Math.max(aRoles.length, bRoles.length); index += 1) {
    const difference = (aRoles[index] ?? 0) - (bRoles[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

export function getStageClass(value: unknown) {
  const stage = stageTextMap[String(value)] ?? String(value);
  return stageClassMap[stage] ?? '';
}

export function getStageText(value: unknown) {
  const stage = stageTextMap[String(value)];
  return stage ? `${stage}阶段` : '-';
}

export function getDifficultyClass(value: unknown) {
  return difficultyClassMap[String(value)] ?? '';
}

export function getDifficultyText(value: unknown) {
  return difficultyTextMap[String(value)] ?? '-';
}

export function getModeText(value: unknown) {
  return modeTextMap[Number(value)] ?? '-';
}

export function formatDamage(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

export function formatDateTime(value: unknown) {
  if (!value) return '-';

  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);

  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getTeamRoles(row: TeamListItem): TeamRoleItem[] {
  const roles = row.roles ?? [];

  return [...roles].toSorted(
    (a, b) =>
      Number(b.search_area_width ?? 0) - Number(a.search_area_width ?? 0) ||
      Number(a.role_id) - Number(b.role_id),
  );
}

export function getTableRoleForSlot(row: TeamListItem, slotIndex: number) {
  const roles = getTeamRoles(row);
  const firstRoleSlot = 5 - roles.length;

  return slotIndex < firstRoleSlot ? undefined : roles[slotIndex - firstRoleSlot];
}

export function getTeamAuthor(row: TeamListItem) {
  return row.author || '-';
}

export function getTeamLink(row: TeamListItem) {
  return row.link || row.url || '';
}

export function getTeamDifficulty(row: TeamListItem) {
  return row.difficulty;
}

export function getBossText(row: TeamListItem) {
  const boss = row.boss;

  if (boss === null || boss === undefined) {
    return '-';
  }

  return `${boss}王`;
}

export function getRoleInputTokens(value: string) {
  return value
    .trim()
    .split(/[\s,，、|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getRoleOptionByNickname(
  nickname: string,
  roleOptions: TeamRoleOption[],
) {
  if (!nickname) {
    return undefined;
  }

  return roleOptions.find((role) => role.nickname === nickname);
}

export function getDisplayRoleNames(
  roles: string[],
  roleOptions: TeamRoleOption[],
) {
  return roles
    .map((nickname) => getRoleOptionByNickname(nickname, roleOptions))
    .filter((role): role is TeamRoleOption => role !== undefined)
    .toSorted(
      (a, b) =>
        Number(b.search_area_width) - Number(a.search_area_width) ||
        Number(a.id) - Number(b.id),
    )
    .map((role) => role.nickname);
}

export function getRoleForSlot(
  roles: string[],
  slotIndex: number,
  roleOptions: TeamRoleOption[],
) {
  const orderedRoles = getDisplayRoleNames(roles.slice(0, 5), roleOptions);
  const startIndex = 5 - orderedRoles.length;
  const roleIndex = slotIndex - startIndex;

  if (roleIndex < 0) {
    return '';
  }

  return orderedRoles[roleIndex] ?? '';
}

export function getRoleOptionForSlot(
  roles: string[],
  slotIndex: number,
  roleOptions: TeamRoleOption[],
) {
  const nickname = getRoleForSlot(roles, slotIndex, roleOptions);

  return getRoleOptionByNickname(nickname, roleOptions);
}

export function getRoleDamage(
  stage: number | string,
  boss: number | string,
) {
  const stageId = stageIdMap[String(stage)] ?? Number(stage);
  const bossId = Number(String(boss).replaceAll(/\D/g, ''));

  return bossHealth[stageId]?.[bossId];
}

export function isFixedDamageStage(stage: number | string | undefined) {
  const stageId = stageIdMap[String(stage)] ?? Number(stage);

  return stageId === 2 || stageId === 3;
}

export function getRecordDamageText(record: TeamDraftRecord) {
  if (!isFixedDamageStage(record.stage)) {
    return record.damage || '-';
  }

  return '按Boss自动';
}

export function getAuthorLength(value: string) {
  return [...value].reduce(
    (length, char) => length + (/^[\u4E00-\u9FFF]$/.test(char) ? 2 : 1),
    0,
  );
}
