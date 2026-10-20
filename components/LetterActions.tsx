"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LIMITS_REPLY_MAX, STATUSES, Status } from "@/lib/config";

type Props = {
  id: string;
  status: Status;
  allowPublic: boolean;
  isPublic: boolean;
  reply: string | null;
};

export default function LetterActions({ id, status, allowPublic, isPublic, reply }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reply ?? "");
  const [publishWithReply, setPublishWithReply] = useState(allowPublic);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "更新失敗，請重新整理後再試。");
      startTransition(() => router.refresh());
      return true;
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失敗");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveReply() {
    const body: Record<string, unknown> = { reply: draft };
    if (draft.trim()) {
      if (status === "new" || status === "processing") body.status = "done";
      if (publishWithReply && allowPublic) body.is_public = true;
    }
    if (await patch(body)) setEditing(false);
  }

  const busy = saving || pending;

  return (
    <div className="actions">
      {reply && !editing && (
        <div className="reply-box">
          <div className="reply-label">學生會回覆</div>
          <p className="letter-body">{reply}</p>
        </div>
      )}

      {editing && (
        <div className="reply-editor">
          <textarea
            className="textarea"
            style={{ minHeight: 120 }}
            placeholder="輸入回覆內容，公開後會顯示在首頁的公告區"
            value={draft}
            maxLength={LIMITS_REPLY_MAX}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="reply-editor-foot">
            {allowPublic && (
              <label className="check">
                <input type="checkbox" checked={publishWithReply} onChange={(e) => setPublishWithReply(e.target.checked)} />
                同時公開到公告
              </label>
            )}
            <span style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setDraft(reply ?? ""); }} disabled={busy}>
              取消
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveReply} disabled={busy}>
              {busy ? "儲存中…" : "儲存回覆"}
            </button>
          </div>
        </div>
      )}

      <div className="letter-foot">
        <label className="inline-field">
          狀態
          <select
            className="status-select"
            value={status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {(Object.keys(STATUSES) as Status[]).map((s) => (
              <option key={s} value={s}>{STATUSES[s]}</option>
            ))}
          </select>
        </label>

        {allowPublic ? (
          <button
            type="button"
            className={`btn btn-sm ${isPublic ? "btn-public-on" : "btn-ghost"}`}
            disabled={busy}
            onClick={() => patch({ is_public: !isPublic })}
          >
            {isPublic ? "✓ 已公開在公告" : "公開到公告"}
          </button>
        ) : (
          <span className="muted-note">投信者不同意公開</span>
        )}

        <span style={{ flex: 1 }} />

        {!editing && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} disabled={busy}>
            {reply ? "編輯回覆" : "回覆"}
          </button>
        )}
      </div>
    </div>
  );
}
