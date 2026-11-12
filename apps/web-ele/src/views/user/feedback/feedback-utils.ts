import type {
  FeedbackCategory,
  FeedbackStatus,
} from '#/api/core/feedback';

export type FeedbackTagType =
  | 'danger'
  | 'info'
  | 'primary'
  | 'success'
  | 'warning';

export interface FeedbackCategoryOption {
  label: string;
  value: FeedbackCategory;
}

export interface FeedbackStatusOption {
  label: string;
  tagType: FeedbackTagType;
  value: FeedbackStatus;
}

export const FEEDBACK_CATEGORY_OPTIONS: FeedbackCategoryOption[] = [
  { label: '使用问题', value: 1 },
  { label: '功能建议', value: 2 },
  { label: '改进建议', value: 3 },
  { label: '其他', value: 4 },
];

export const FEEDBACK_STATUS_OPTIONS: FeedbackStatusOption[] = [
  { label: '待处理', tagType: 'warning', value: 0 },
  { label: '处理中', tagType: 'primary', value: 1 },
  { label: '已回复', tagType: 'success', value: 2 },
  { label: '已关闭', tagType: 'info', value: 3 },
];

export const MAX_FEEDBACK_IMAGES = 3;

export const MAX_FEEDBACK_IMAGE_BYTES = 5 * 1024 * 1024;

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ACCEPTED_EXTENSIONS = new Set(['jpeg', 'jpg', 'png', 'webp']);

export function feedbackStatusTagType(
  status: FeedbackStatus,
): FeedbackTagType {
  return (
    FEEDBACK_STATUS_OPTIONS.find((option) => option.value === status)?.tagType ??
    'info'
  );
}

export function formatDateTime(value: null | string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') : value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function validateFeedbackImage(file: File) {
  if (file.size <= 0) {
    return '图片读取失败，请重新选择';
  }

  if (file.size > MAX_FEEDBACK_IMAGE_BYTES) {
    return '单张图片不能超过 5MB';
  }

  const type = file.type.toLowerCase();

  if (type) {
    return ACCEPTED_MIME_TYPES.has(type)
      ? null
      : '仅支持 JPG、JPEG、PNG、WEBP 格式的图片';
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  return ACCEPTED_EXTENSIONS.has(extension)
    ? null
    : '仅支持 JPG、JPEG、PNG、WEBP 格式的图片';
}
