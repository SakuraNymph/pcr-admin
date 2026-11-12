import { requestClient } from '#/api/request';

export type FeedbackCategory = 1 | 2 | 3 | 4;

export type FeedbackSenderType = 1 | 2;

export type FeedbackStatus = 0 | 1 | 2 | 3;

export interface FeedbackImage {
  file_size: number;
  id: number;
  mime_type: string;
  original_name: string;
  url: string;
}

export interface FeedbackListItem {
  category: FeedbackCategory;
  category_name: string;
  created_at: null | string;
  id: number;
  last_message_at: null | string;
  nickname: null | string;
  public_uid: number;
  status: FeedbackStatus;
  status_name: string;
  title: string;
  unread_count: number;
}

export interface FeedbackListPage {
  items: FeedbackListItem[];
  last_page: number;
  page: number;
  per_page: number;
  total: number;
}

export interface FeedbackListQuery {
  category?: FeedbackCategory;
  end_date?: string;
  has_unread?: 0 | 1;
  nickname?: string;
  page?: number;
  public_uid?: number;
  start_date?: string;
  status?: FeedbackStatus;
  title?: string;
}

export interface FeedbackMessage {
  content: null | string;
  created_at: null | string;
  id: number;
  images: FeedbackImage[];
  read_at: null | string;
  sender_type: FeedbackSenderType;
}

export interface FeedbackReadResult {
  read_count: number;
  unread_count: number;
}

export interface FeedbackReplyPayload {
  content?: string;
  files?: File[];
}

export interface FeedbackReplyResult {
  last_message_at: null | string;
  message: FeedbackMessage;
  status: FeedbackStatus;
  status_name: string;
}

export interface FeedbackStatistics {
  closed: number;
  pending: number;
  processing: number;
  replied: number;
  total: number;
}

export interface FeedbackStatusUpdateResult {
  status: FeedbackStatus;
  status_name: string;
  updated_at: null | string;
}

export interface FeedbackUserSummary {
  avatar_url: null | string;
  nickname: null | string;
  public_uid: null | number;
  registered_at: null | string;
  status: number;
}

export interface FeedbackDetail {
  category: FeedbackCategory;
  category_name: string;
  client_type: null | string;
  client_version: null | string;
  created_at: null | string;
  id: number;
  last_message_at: null | string;
  messages: FeedbackMessage[];
  nickname: null | string;
  public_uid: number;
  status: FeedbackStatus;
  status_name: string;
  title: string;
  unread_count: number;
  user: FeedbackUserSummary | null;
}

export async function getFeedbackListApi(params?: FeedbackListQuery) {
  return requestClient.get<FeedbackListPage>('/feedback', {
    params,
  });
}

export async function getFeedbackStatisticsApi() {
  return requestClient.get<FeedbackStatistics>('/feedback/statistics');
}

export async function getFeedbackDetailApi(id: number) {
  return requestClient.get<FeedbackDetail>(`/feedback/${id}`);
}

export async function updateFeedbackStatusApi(
  id: number,
  status: FeedbackStatus,
) {
  return requestClient.put<FeedbackStatusUpdateResult>(
    `/feedback/${id}/status`,
    { status },
  );
}

export async function markFeedbackReadApi(
  id: number,
  throughMessageId: number,
) {
  return requestClient.post<FeedbackReadResult>(`/feedback/${id}/read`, {
    through_message_id: throughMessageId,
  });
}

export async function replyFeedbackApi(
  id: number,
  payload: FeedbackReplyPayload,
  onProgress?: (percent: number) => void,
) {
  const content = (payload.content ?? '').trim();
  const files = payload.files ?? [];

  if (!content && files.length === 0) {
    throw new Error('请输入回复内容或至少上传一张图片');
  }

  const path = `/feedback/${id}/messages`;

  if (files.length === 0) {
    return requestClient.post<FeedbackReplyResult>(path, { content });
  }

  const formData = new FormData();

  if (content) {
    formData.append('content', content);
  }

  files.forEach((file, index) => {
    formData.append(`images[${index}]`, file);
  });

  return requestClient.post<FeedbackReplyResult>(path, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!event.total) {
        return;
      }

      const percent = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      onProgress?.(percent);
    },
    timeout: 60_000,
  });
}
