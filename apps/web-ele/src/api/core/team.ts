import { requestClient } from '#/api/request';

/**
 * ==========================
 * 角色选项
 * ==========================
 */
export interface TeamRoleOption {
  /**
   * 角色 ID
   */
  id: number;

  /**
   * 角色昵称
   */
  nickname: string;

  /**
   * 角色头像地址
   */
  image_url: null | string;

  /** 角色在角色框中的排序值 */
  search_area_width: number;

  /** 角色使用次数，用于昵称候选排序 */
  use_times: number;
}

/**
 * ==========================
 * 作业角色
 * ==========================
 */
export interface TeamRoleItem {
  id: number;

  team_id: number;

  role_id: number;

  nickname: null | string;

  name: null | string;

  image_url: null | string;

  search_area_width?: number;

  sort: number;
}

/**
 * ==========================
 * 作业关联
 * ==========================
 */
export interface TeamLinkItem {
  id: number;

  team_id: number;

  author: string;

  link: string;

  url?: string;

  difficulty: number;

  damage: number;

  status?: number;
}

/**
 * ==========================
 * 作业数据
 * ==========================
 */
export interface TeamItem {
  id: number;

  stage: number;

  boss: number;

  mode: number;

  damage: number;

  atk_value: number;

  status: number;

  difficulty: null | number;

  created_at: string;

  updated_at: string;

  roles?: TeamRoleItem[];

  links?: TeamLinkItem[];
}

/** 作业列表的一行对应一条 team_links 来源记录。 */
export interface TeamListItem {
  link_id: number;
  team_id: number;
  stage: number;
  boss: number;
  mode: number;
  difficulty: number;
  /** 当前来源的伤害 */
  damage: number;
  /** 同一阵容所有来源的最高伤害 */
  team_damage: number;
  atk_value: number;
  team_key: string;
  status: number;
  author: string;
  link: string;
  url: string;
  created_at: string;
  updated_at: string;
  roles: TeamRoleItem[];
}

/**
 * ==========================
 * 查询参数
 * ==========================
 */
export interface TeamListParams {
  /**
   * 月份
   * 使用 created_at 查询
   */
  month?: string;

  /**
   * 阶段
   */
  stage?: number;

  /**
   * boss
   */
  boss?: number;

  /**
   * 模式
   */
  mode?: number;

  /**
   * 难度
   */
  difficulty?: number;

  /**
   * 作者
   */
  author?: string;

  /**
   * 攻击类型
   */
  atk_type?: number;

  /**
   * 状态
   */
  status?: number;

}

export interface TeamLineupOption {
  team_id: number;
  team_key: string;
  roles: TeamRoleItem[];
}

export interface TeamRecordPayload {
  boss: number[];

  damage: null | number;

  difficulty: number;

  roles: number[];

  stage: number;
}

/**
 * ==========================
 * 添加作业参数
 * ==========================
 */
export interface CreateTeamPayload {
  author: string;

  link: string;

  records: {
    boss: number[];
    damage: null | number;
    difficulty: number;
    roles: number[];
    stage: number;
  }[];
}

export interface UpdateTeamPayload {
  author: string;
  link: string;
  stage: number;
  boss: number;
  difficulty: number;
  damage: number;
  roles: number[];
}

export interface UpdateTeamLinkPayload {
  author: string;
  link: string;
  difficulty: number;
  damage?: null | number;
}

export type TeamPageResult = TeamListItem[];

/**
 * 获取全部角色选项
 *
 * 用于根据角色昵称匹配角色 ID 和头像。
 */
export async function getTeamRoleOptionsApi() {
  return requestClient.get<TeamRoleOption[]>('/game/roles/options');
}

/** 获取本月 D 阶段阵容首角色候选 */
export async function getDStageLineupOptionsApi(prefix: string) {
  return requestClient.get<TeamLineupOption[]>('/game/teams/d-stage-lineups/options', {
    params: { prefix },
  });
}

/**
 * 获取作业列表
 */
export async function getTeamsApi(params?: TeamListParams) {
  return requestClient.get<TeamPageResult>('/game/teams', {
    params,
  });
}

/** 获取单条作业详情 */
export async function getTeamApi(id: number) {
  return requestClient.get<TeamItem>(`/game/teams/${id}`);
}

/**
 * 批量添加作业
 */
export async function createTeamApi(payload: CreateTeamPayload) {
  return requestClient.post('/game/teams', payload);
}

/** 修改单条作业 */
export async function updateTeamApi(id: number, payload: UpdateTeamPayload) {
  return requestClient.put<TeamItem>(`/game/teams/${id}`, payload);
}

/** 软隐藏作业 */
export async function deleteTeamApi(id: number) {
  return requestClient.delete<unknown>(`/game/teams/${id}`);
}

/** 恢复或隐藏作业 */
export async function updateTeamStatusApi(id: number, status: 0 | 1) {
  return requestClient.request<unknown>(`/game/teams/${id}/status`, {
    method: 'PATCH',
    data: { status },
  });
}

/** 修改单条来源链接 */
export async function updateTeamLinkApi(
  teamId: number,
  linkId: number,
  payload: UpdateTeamLinkPayload,
) {
  return requestClient.put<TeamListItem>(
    `/game/teams/${teamId}/links/${linkId}`,
    payload,
  );
}

/** 隐藏单条来源链接 */
export async function deleteTeamLinkApi(teamId: number, linkId: number) {
  return requestClient.delete<unknown>(`/game/teams/${teamId}/links/${linkId}`);
}

/** 恢复或隐藏单条来源链接 */
export async function updateTeamLinkStatusApi(
  teamId: number,
  linkId: number,
  status: 0 | 1,
) {
  return requestClient.request<unknown>(
    `/game/teams/${teamId}/links/${linkId}/status`,
    {
      method: 'PATCH',
      data: { status },
    },
  );
}
