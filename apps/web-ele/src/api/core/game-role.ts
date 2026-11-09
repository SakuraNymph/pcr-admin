import { requestClient } from '#/api/request';

/**
 * -------------------------------------------------------------------------
 * 1. 数据模型
 * -------------------------------------------------------------------------
 */

/**
 * 游戏角色头像
 */
export interface GameRoleImage {
  /** 主键 */
  id: number;

  /** 游戏角色 ID */
  game_role_id: number;

  /** 头像 ID */
  image_id: number;

  /** 是否六星头像 */
  is_6_star: boolean;

  /** 是否已经下载 */
  is_download: boolean;

  /** 创建时间 */
  created_at?: string;

  /** 更新时间 */
  updated_at?: string;
}

/**
 * 游戏角色使用统计
 */
export interface GameRoleStatistics {
  /** 主键 */
  id: number;

  /** 游戏角色 ID */
  game_role_id: number;

  /** 使用次数 */
  use_times: number;

  /** 创建时间 */
  created_at?: string;

  /** 更新时间 */
  updated_at?: string;
}

/**
 * 游戏角色
 */
export interface GameRoleItem {
  /** 主键 */
  id: number;

  /** 角色 ID */
  role_id: number;

  /** 一星角色 ID */
  role_id_1: number;

  /** 三星角色 ID */
  role_id_3: number;

  /** 六星角色 ID */
  role_id_6: null | number;

  /** 属性 */
  element: number;

  /** 攻击类型 */
  atk_type: number;

  /** 是否公会战角色 */
  is_clan_battle: boolean;

  /** 角色名称 */
  name: string;

  /** 角色昵称 */
  nickname: string;

  /** 搜索范围 */
  search_area_width: number;

  /** 站位 */
  position: number;

  /** 获取方式 */
  obtain: null | number;

  /** 抽卡概率 */
  probability: null | number;

  /** 卡池时间 */
  up_time: null | string;

  /** 状态 */
  status: boolean;

  /** 使用次数 */
  use_times?: number;

  /** 头像数据 */
  image?: GameRoleImage | null;

  /** 头像地址 */
  image_url?: null | string;

  /** 使用统计 */
  statistics?: GameRoleStatistics | null;

  /** 创建时间 */
  created_at?: string;

  /** 更新时间 */
  updated_at?: string;
}

/**
 * 游戏角色列表查询参数
 */
export interface GameRoleListParams {
  /** 当前页 */
  page?: number;

  /** 每页数量 */
  pageSize?: number;

  /** 名称 / 昵称 */
  name?: string;

  /** 属性 */
  element?: number;

  /** 攻击类型 */
  atk_type?: number;

  /** 站位 */
  position?: number;

  /** 是否公会战角色 */
  is_clan_battle?: boolean;

  /** 状态 */
  status?: boolean;

  /** 获取方式 */
  obtain?: number;

  /** 抽卡概率 */
  probability?: number;
}

/**
 * 游戏角色分页数据
 */
export interface GameRoleListResult {
  /** 数据列表 */
  items: GameRoleItem[];

  /** 总数量 */
  total: number;

  /** 当前页 */
  page: number;

  /** 每页数量 */
  pageSize: number;
}

/**
 * 新增游戏角色参数
 *
 * 注意：
 * role_id、role_id_1、role_id_3、role_id_6
 * 由后端根据 id 自动计算，不需要前端提交。
 */
export interface CreateGameRolePayload {
  /** 角色 ID */
  id: number;

  /** 名称 A */
  name_a: string;

  /** 名称 B */
  name_b?: string;

  /** 属性 */
  element: number;

  /** 攻击类型 */
  atk_type: number;

  /** 是否公会战角色 */
  is_clan_battle?: boolean;

  /** 角色昵称 */
  nickname: string;

  /** 搜索范围 */
  search_area_width: number;

  /** 站位 */
  position: number;

  /** 获取方式 */
  obtain: number;

  /** 抽卡概率 */
  probability: number;

  /** 卡池时间 */
  up_time?: null | string;

  /** 状态 */
  status?: boolean;
}

/**
 * 修改游戏角色参数
 *
 * 修改时角色 ID 不允许修改。
 */
export interface UpdateGameRolePayload {
  /** 名称 A */
  name_a: string;

  /** 名称 B */
  name_b?: string;

  /** 属性 */
  element: number;

  /** 攻击类型 */
  atk_type: number;

  /** 是否公会战角色 */
  is_clan_battle?: boolean;

  /** 角色昵称 */
  nickname: string;

  /** 搜索范围 */
  search_area_width: number;

  /** 站位 */
  position: number;

  /** 获取方式 */
  obtain: number;

  /** 抽卡概率 */
  probability: number;

  /** 卡池时间 */
  up_time?: null | string;

  /** 状态 */
  status?: boolean;
}

/**
 * -------------------------------------------------------------------------
 * 2. API
 * -------------------------------------------------------------------------
 */

/**
 * 获取游戏角色列表
 */
export async function getGameRolesApi(params?: GameRoleListParams) {
  return requestClient.get<GameRoleListResult>('/game/roles', {
    params,
  });
}

/**
 * 获取游戏角色详情
 */
export async function getGameRoleApi(id: number) {
  return requestClient.get<GameRoleItem>(`/game/roles/${id}`);
}

/**
 * 新增游戏角色
 */
export async function createGameRoleApi(payload: CreateGameRolePayload) {
  return requestClient.post<GameRoleItem>('/game/roles', payload);
}

/**
 * 修改游戏角色
 */
export async function updateGameRoleApi(
  id: number,
  payload: UpdateGameRolePayload,
) {
  return requestClient.put<GameRoleItem>(`/game/roles/${id}`, payload);
}

/**
 * 删除游戏角色
 */
export async function deleteGameRoleApi(id: number) {
  return requestClient.delete<void>(`/game/roles/${id}`);
}
