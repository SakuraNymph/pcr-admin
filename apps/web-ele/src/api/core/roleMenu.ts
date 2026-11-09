import type { MenuItem } from '#/api/core/menu';

import { requestClient } from '#/api/request';

export async function getRoleMenusApi(roleId: number) {
  return requestClient.get<MenuItem[]>(`/roles/${roleId}/menus`);
}

export async function updateRoleMenusApi(roleId: number, menuIds: number[]) {
  return requestClient.put(`/roles/${roleId}/menus`, {
    menu_ids: menuIds,
  });
}
