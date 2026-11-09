import { requestClient } from '#/api/request';

/**

* ---
* 1. 数据模型
* ---

*/

export interface PermissionItem {
  /** 主键 */
  id: number;

  /** 权限名称，例如：admin:status */
  name: string;

  /** 权限中文描述 */
  display_name: string;

  /** 关联菜单 ID */
  menu_id: null | number;

  /** 请求方式 */
  http_method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

  /** API 路径 */
  http_path: string;

  /** 创建时间 */
  created_at?: string;

  /** 更新时间 */
  updated_at?: string;
}

/**

* ---
* 2. API
* ---

*/

/**

* 获取权限列表
  */
export async function getPermissionsApi() {
  return requestClient.get<PermissionItem[]>('/permissions');
}

/**

* 新增权限
  */
export async function createPermission(payload: Partial<PermissionItem>) {
  return requestClient.post<PermissionItem>('/permissions', payload);
}

/**

* 修改权限
  */
export async function updatePermission(
  id: number,
  payload: Partial<PermissionItem>,
) {
  return requestClient.put<PermissionItem>(`/permissions/${id}`, payload);
}

/**

* 删除权限
  */
export async function deletePermission(id: number) {
  return requestClient.delete<void>(`/permissions/${id}`);
}
