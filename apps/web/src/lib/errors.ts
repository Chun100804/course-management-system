import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data.error?.message ?? 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
}
