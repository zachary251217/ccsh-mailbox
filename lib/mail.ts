import nodemailer from "nodemailer";
import type { Letter } from "./store";

/** 有新信件時寄通知到學生會會帳（使用 Gmail 應用程式密碼）。未設定則略過。 */
export async function notifyNewLetter(letter: Letter) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || user;
  if (!user || !pass || !to) return;

  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "") ?? "";
  const subject = `【匿名信箱】${letter.category}${letter.title ? `：${letter.title}` : ""}`;
  const text = [
    `分類：${letter.category}`,
    `標題：${letter.title ?? "（無）"}`,
    `時間：${new Date(letter.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
    `附件：${letter.attachments.length} 個`,
    "",
    letter.content,
    "",
    siteUrl ? `到後台查看：${siteUrl}/admin` : "",
  ].join("\n");

  await transporter.sendMail({ from: `匿名信箱 <${user}>`, to, subject, text });
}
