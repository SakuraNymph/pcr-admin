import { requestClient } from '#/api/request';

/**
 * 用户数据
 */
export interface UserItem {
  id: number;
  ip: string;
  country: null | string;
  province: null | string;
  city: null | string;
  nickname: null | string;
  status: number;
  is_subscribe: boolean;
  email: null | string;
  created_at: string;
  updated_at: string;
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  nickname?: string;
  email?: string;
  ip?: string;
  country?: string;
  province?: string;
  city?: string;
  is_subscribe?: number | string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 用户列表分页数据
 *
 * 后端返回：
 * {
 *   items: UserItem[];
 *   total: number;
 * }
 */
export interface UserPagination {
  items: UserItem[];
  total: number;
}

/**
 * 获取用户列表
 */
export async function getUsersApi(params?: UserListParams) {
  return requestClient.get<UserPagination>('/users', {
    params,
  });
}
