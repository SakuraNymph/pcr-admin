import { requestClient } from '#/api/request';

/**

* 管理员角色
  */
export interface AdminRole {
  id: number;
  name: string;
  code: string;
}

/**

* 管理员数据
  */
export interface AdminItem {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  mobile: string;
  status: number;
  last_login_at: null | string;
  last_login_ip: string;
  created_at: string;
  updated_at: string;
  roles: AdminRole[];
}

/**

* 管理员列表查询参数
  */
export interface AdminListParams {
  username?: string;
  nickname?: string;
  status?: number | string;
  role_id?: number;
  created_start?: string;
  created_end?: string;
  page?: number;
  per_page?: number;
}

/**

* 管理员新增参数
  */
export interface CreateAdminParams {
  username: string;
  nickname: string;
  password: string;
  email?: string;
  mobile?: string;
  status: number;
  role_ids: number[];
}

/**

* 管理员修改参数
  */
export interface UpdateAdminParams {
  username: string;
  nickname: string;
  password?: string;
  email?: string;
  mobile?: string;
  status: number;
  role_ids: number[];
}

/**

* 分页数据
  */
export interface AdminPagination {
  current_page: number;
  data: AdminItem[];
  first_page_url: string;
  from: null | number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    active: boolean;
    label: string;
    page: null | number;
    url: null | string;
  }>;
  next_page_url: null | string;
  path: string;
  per_page: number;
  prev_page_url: null | string;
  to: null | number;
  total: number;
}

/**

* 获取管理员列表
  */
export async function getAdminsApi(params?: AdminListParams) {
  return requestClient.get<AdminPagination>('/admins', {
    params,
  });
}

/**

* 新增管理员
  */
export async function createAdminApi(data: CreateAdminParams) {
  return requestClient.post('/admins', data);
}

/**

* 修改管理员
  */
export async function updateAdminApi(id: number, data: UpdateAdminParams) {
  return requestClient.put(`/admins/${id}`, data);
}

/**

* 删除管理员
  */
export async function deleteAdminApi(id: number) {
  return requestClient.delete(`/admins/${id}`);
}

/**

* 获取角色列表
  */
export async function getRolesApi() {
  return requestClient.get<AdminRole[]>('/roles');
}

/**

* 修改管理员状态
  */
export function updateAdminStatusApi(id: number) {
  return requestClient.put<AdminItem>(`/admins/${id}/status`);
}
