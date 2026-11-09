import type { PermissionItem } from '#/api/core/permission';

import { requestClient } from '#/api/request';

/**

* 获取角色已有的 API 权限
  */
export async function getRolePermissionsApi(roleId: number) {
  return requestClient.get<PermissionItem[]>(`/roles/${roleId}/permissions`);
}

/**

* 保存角色 API 权限
*
* 后端使用 sync：
* 传入什么就保存什么。
  */
export async function updateRolePermissionsApi(
  roleId: number,
  permissionIds: number[],
) {
  return requestClient.put(`/roles/${roleId}/permissions`, {
    permission_ids: permissionIds,
  });
}
