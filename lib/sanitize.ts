import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import type { UploadFile } from "./store";

/**
 * 移除附件中可能洩漏身分的資訊：
 * - 圖片：重新編碼，丟掉 EXIF（GPS、拍攝時間、手機型號等）
 * - PDF：清空作者、建立工具等文件資訊
 * - 檔名：一律改成「附件N」，避免原檔名含有姓名
 */
export async function sanitizeFile(type: string, data: Buffer, index: number): Promise<UploadFile> {
  const name = `附件${index + 1}`;

  if (type === "application/pdf") {
    const pdf = await PDFDocument.load(data, { updateMetadata: false });
    pdf.setTitle("");
    pdf.setAuthor("");
    pdf.setSubject("");
    pdf.setKeywords([]);
    pdf.setCreator("");
    pdf.setProducer("");
    pdf.setCreationDate(new Date(0));
    pdf.setModificationDate(new Date(0));
    return { name: `${name}.pdf`, type, data: Buffer.from(await pdf.save()) };
  }

  // HEIC 等格式統一轉成 JPEG，方便後台直接預覽
  const img = sharp(data, { failOn: "error" }).rotate();
  if (type === "image/png") {
    return { name: `${name}.png`, type, data: await img.png().toBuffer() };
  }
  if (type === "image/webp") {
    return { name: `${name}.webp`, type, data: await img.webp().toBuffer() };
  }
  return { name: `${name}.jpg`, type: "image/jpeg", data: await img.jpeg({ quality: 85 }).toBuffer() };
}
