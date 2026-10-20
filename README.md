# 中正高中學生會匿名信箱

學生不需登入即可匿名投信；學生會用會帳（Google）登入後台查看，有新信時會寄通知到會帳。

## 本機預覽

```bash
npm install
npm run dev
```

- 投信頁：http://localhost:3000
- 後台：http://localhost:3000/admin

沒有設定任何環境變數時會進入**預覽模式**：信件存在 `.data/`，後台不需登入。

## 匿名設計

- 不需登入、不收集姓名學號
- 資料庫只存：分類、標題、內容、狀態、時間、附件
- IP 只在記憶體中（加鹽雜湊）做頻率限制，不寫入資料庫，重啟即消失
- 圖片重新編碼，移除 EXIF（GPS、拍攝時間、手機型號）；PDF 清空作者等資訊
- 附件檔名一律改為「附件1、附件2…」

> 注意：Vercel 平台本身會保留一般的存取紀錄（含 IP），這是平台層級、本程式無法控制的部分。

## 部署（Vercel + Supabase）

1. **Supabase**：建立專案 → SQL Editor 執行 `supabase/schema.sql` → 在 Project Settings → API 取得 URL 與 `service_role` key
2. **Google 登入**：Google Cloud Console → 建立 OAuth 用戶端（網頁應用程式），授權重新導向 URI 填
   `https://你的網域/api/auth/callback/google`
3. **Gmail 通知**：用會帳開啟兩步驟驗證 → 建立「應用程式密碼」
4. **Vercel**：匯入此專案，依照 `.env.example` 填入環境變數後部署

## 限制

- 附件最多 3 個、合計 4MB（Vercel 單次請求上限約 4.5MB，圖片會先在瀏覽器壓縮）
- 同一來源 10 分鐘最多投 5 封
