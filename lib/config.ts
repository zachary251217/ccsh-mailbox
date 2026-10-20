export const SITE_TITLE = "中正高中學生會匿名信箱";

export const CATEGORIES = [
  "校園設施",
  "活動建議",
  "課業相關",
  "霸凌／申訴",
  "其他",
] as const;

/**
 * 公告區顯示方式：
 * false（預設）＝學生會在後台按「公開」或回覆後，才會出現在公告
 * true＝投信者同意公開的信件，送出後立即出現在公告（後台仍可隱藏）
 */
export const AUTO_PUBLISH = false;

export const LIMITS_REPLY_MAX = 3000;

export const STATUSES = {
  new: "未讀",
  processing: "處理中",
  done: "已處理",
  archived: "封存",
} as const;
export type Status = keyof typeof STATUSES;

export const LIMITS = {
  titleMax: 50,
  contentMin: 5,
  contentMax: 3000,
  maxFiles: 3,
  // Vercel 單次請求上限約 4.5MB，所以總大小限制 4MB（圖片會先在瀏覽器壓縮）
  maxTotalBytes: 4 * 1024 * 1024,
  // 同一來源 10 分鐘內最多投 5 封
  rateWindowMs: 10 * 60 * 1000,
  rateMax: 5,
};

export const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heic",
  "application/pdf": "pdf",
};
