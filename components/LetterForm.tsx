"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ALLOWED_TYPES, CATEGORIES, LIMITS } from "@/lib/config";
import { checkContent } from "@/lib/moderation";

type Picked = { file: File; preview: string | null };

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

/** 在瀏覽器先把圖片縮小並重新編碼（同時去掉 EXIF），減少上傳大小。 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "image.jpg", { type: "image/jpeg" });
  } catch {
    // 瀏覽器無法解碼（例如部分瀏覽器的 HEIC），交給伺服器處理
    return file;
  }
}

export default function LetterForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const [allowPublic, setAllowPublic] = useState(true);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)), [files]);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setError("");
    const incoming = Array.from(list);
    if (files.length + incoming.length > LIMITS.maxFiles) {
      setError(`最多只能附加 ${LIMITS.maxFiles} 個檔案。`);
      return;
    }
    const next: Picked[] = [];
    for (const raw of incoming) {
      if (!ALLOWED_TYPES[raw.type]) {
        setError("只接受 JPG、PNG、WEBP、HEIC 圖片或 PDF 檔。");
        return;
      }
      const file = await compressImage(raw);
      next.push({ file, preview: file.type.startsWith("image/") && file.type !== "image/heic" ? URL.createObjectURL(file) : null });
    }
    const total = [...files, ...next].reduce((n, f) => n + f.file.size, 0);
    if (total > LIMITS.maxTotalBytes) {
      setError("附件總大小不能超過 4MB。");
      return;
    }
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!category) return setError("請選擇一個分類。");
    if (content.trim().length < LIMITS.contentMin) return setError(`內容至少要 ${LIMITS.contentMin} 個字。`);

    const moderation = checkContent(title, content);
    if (!moderation.ok) return setError(moderation.message);

    const fd = new FormData(e.currentTarget);
    fd.set("category", category);
    fd.delete("files");
    files.forEach((f) => fd.append("files", f.file));

    setSending(true);
    try {
      const res = await fetch("/api/letters", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "送出失敗，請稍後再試。");
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出失敗，請稍後再試。");
      window.turnstile?.reset();
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setCategory("");
    setTitle("");
    setContent("");
    setFiles([]);
    setAllowPublic(true);
    setSent(false);
    window.turnstile?.reset();
  }

  if (sent) {
    return (
      <div className="success">
        <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
          <circle cx="48" cy="48" r="46" fill="var(--ok-soft)" />
          <rect x="22" y="30" width="52" height="36" rx="4" fill="var(--paper)" stroke="var(--ok)" strokeWidth="3" />
          <path d="M24 33l24 18 24-18" fill="none" stroke="var(--ok)" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="70" cy="64" r="12" fill="var(--ok)" />
          <path d="M64.5 64l4 4 7-8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2>信已經送出了！</h2>
        <p>謝謝你的意見，學生會會認真閱讀每一封信。{allowPublic && "回覆後會公布在下方的公告區。"}</p>
        <button type="button" className="btn btn-ghost" onClick={reset}>再寫一封</button>
      </div>
    );
  }

  const over = content.length > LIMITS.contentMax;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}

      <div className="field">
        <div className="label" id="cat-label"><span>分類<span className="req">*</span></span></div>
        <div className="chips" role="radiogroup" aria-labelledby="cat-label">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              className="chip"
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="title">標題 <small>選填</small></label>
        <input
          id="title"
          name="title"
          className="input"
          maxLength={LIMITS.titleMax}
          placeholder="簡單描述一下想說的事"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="content"><span>內容<span className="req">*</span></span></label>
        <textarea
          id="content"
          name="content"
          className="textarea"
          placeholder={"想對學生會說的話都可以寫在這裡。\n請不要在內容中留下自己的姓名、班級或學號。\n匿名不代表免責，請為自己說的話負責。"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="field-foot">
          <p className="disclaimer">
            ⚠ 匿名不代表免責。請勿發表不實指控、人身攻擊、歧視、恐嚇或洩漏他人隱私的內容；若內容涉及違法（如公然侮辱、誹謗），須自負法律責任。
          </p>
          <div className={`counter${over ? " over" : ""}`}>{content.length} / {LIMITS.contentMax}</div>
        </div>
      </div>

      <div className="field">
        <div className="label">附件 <small>選填・最多 {LIMITS.maxFiles} 個・合計 4MB</small></div>
        <label
          className={`dropzone${drag ? " drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
          <strong>點擊選擇或拖曳檔案到這裡</strong>
          <small>支援 JPG、PNG、WEBP、HEIC、PDF</small>
          <input
            ref={inputRef}
            type="file"
            name="files"
            multiple
            accept={Object.keys(ALLOWED_TYPES).join(",")}
            hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        {files.length > 0 && (
          <div className="files">
            {files.map((f, i) => (
              <div className="file-thumb" key={i}>
                {f.preview ? <img src={f.preview} alt={`附件 ${i + 1}`} /> : <span>{f.file.type === "application/pdf" ? "PDF" : "圖片"}</span>}
                <button type="button" className="file-remove" aria-label="移除" onClick={() => removeFile(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label className="check consent">
          <input type="checkbox" name="allow_public" checked={allowPublic} onChange={(e) => setAllowPublic(e.target.checked)} />
          <span>
            同意學生會將這封信公開到公告區
            <small>只會公開分類、標題與內容，不含附件。學生會審核後才會公開。</small>
          </span>
        </label>
      </div>

      {turnstileSiteKey && (
        <div className="field">
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-language="zh-tw" />
        </div>
      )}

      {error && <div className="error" role="alert">{error}</div>}

      <button type="submit" className="btn btn-primary btn-block" disabled={sending || over}>
        {sending ? "送出中…" : "匿名送出"}
      </button>
    </form>
  );
}
