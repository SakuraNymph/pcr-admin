import { requestClient } from '#/api/request';

export type BossPeriod = 'current' | 'previous';

export type BossDisplaySource = 'current' | 'none' | 'previous';

export interface BossRecord {
  id: number;
  candidate_key: string;
  name: string;
  file_path: string;
  image_url: string;
  year_month: null | string;
  status: 0 | 1;
  sort: number;
}

export interface BossSeat {
  sort: number;
  label: string;
  current_boss: BossRecord | null;
  previous_boss: BossRecord | null;
  display_boss: BossRecord | null;
  display_source: BossDisplaySource;
  options: BossRecord[];
}

export interface BossOverview {
  period: BossPeriod;
  year_month: string;
  previous_year_month: string;
  read_only: boolean;
  seats: BossSeat[];
}

export interface SelectBossPayload {
  boss_id: number;
  period: BossPeriod;
  sort: number;
}

export async function getBossOverviewApi(period: BossPeriod) {
  return requestClient.get<BossOverview>('/game/bosses', {
    params: { period },
  });
}

export async function selectBossApi(payload: SelectBossPayload) {
  return requestClient.put<BossSeat>('/game/bosses/select', payload);
}
