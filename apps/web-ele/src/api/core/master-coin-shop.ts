import { requestClient } from '#/api/request';

export type MasterCoinShopType = 1 | 2;

export interface MasterCoinShopRoleBase {
  /** game_roles.id */
  game_role_id: number;
  /** 游戏官方角色 ID */
  role_id: number;
  name: string;
  nickname: string;
  element: number;
  atk_type: number;
  position: number;
  search_area_width: number;
  status: boolean;
  image_url: null | string;
}

export interface MasterCoinShopRoleItem extends MasterCoinShopRoleBase {
  /** 商店配置记录 ID */
  id: number;
  type: MasterCoinShopType;
  sort_order: number;
}

export interface MasterCoinShopSearchRole extends MasterCoinShopRoleBase {
  shop_type: MasterCoinShopType | null;
}

export interface MasterCoinShopOverview {
  fes: MasterCoinShopRoleItem[];
  non_fes: MasterCoinShopRoleItem[];
}

export interface AddMasterCoinShopRolePayload {
  game_role_id: number;
  type: MasterCoinShopType;
}

export async function getMasterCoinShopOverviewApi() {
  return requestClient.get<MasterCoinShopOverview>(
    '/game/master-coin-shop',
  );
}

export async function searchMasterCoinShopGameRolesApi(keyword: string) {
  return requestClient.get<MasterCoinShopSearchRole[]>(
    '/game/master-coin-shop/game-roles',
    {
      params: { keyword },
    },
  );
}

export async function addMasterCoinShopRoleApi(
  payload: AddMasterCoinShopRolePayload,
) {
  return requestClient.post<MasterCoinShopRoleItem>(
    '/game/master-coin-shop/roles',
    payload,
  );
}

export async function updateMasterCoinShopRoleTypeApi(
  gameRoleId: number,
  type: MasterCoinShopType,
) {
  return requestClient.put<MasterCoinShopRoleItem>(
    `/game/master-coin-shop/roles/${gameRoleId}/type`,
    { type },
  );
}

export async function sortMasterCoinShopGroupApi(
  type: MasterCoinShopType,
  gameRoleIds: number[],
) {
  return requestClient.put<MasterCoinShopOverview>(
    `/game/master-coin-shop/groups/${type}/sort`,
    {
      game_role_ids: gameRoleIds,
    },
  );
}

export async function removeMasterCoinShopRoleApi(gameRoleId: number) {
  return requestClient.delete<void>(
    `/game/master-coin-shop/roles/${gameRoleId}`,
  );
}
