"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/config";
import type { PublicLetter } from "@/lib/store";

const PAGE = 8;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" });
}

function Item({ l }: { l: PublicLetter }) {
  const long = l.content.length > 140;
  const [open, setOpen] = useState(false);
  return (
    <article className="card ann">
      <div className="letter-head">
        <span className="tag">{l.category}</span>
        <span className="time">{fmtDate(l.created_at)}</span>
      </div>
      <div className="ann-q">
        <span className="ann-mark q" aria-label="匿名提問">Q</span>
        <div className="ann-text">
          {l.title && <h3>{l.title}</h3>}
          <p className={`letter-body${long && !open ? " clamp" : ""}`}>{l.content}</p>
          {long && (
            <button type="button" className="link-btn" onClick={() => setOpen(!open)}>
              {open ? "收合" : "展開全文"}
            </button>
          )}
        </div>
      </div>
      {l.reply ? (
        <div className="ann-a">
          <span className="ann-mark a" aria-label="學生會回覆">A</span>
          <div className="ann-text">
            <div className="ann-a-head">
              學生會回覆
              {l.replied_at && <span className="time">{fmtDate(l.replied_at)}</span>}
            </div>
            <p className="letter-body">{l.reply}</p>
          </div>
        </div>
      ) : (
        <div className="ann-pending">學生會處理中，回覆後會更新在這裡</div>
      )}
    </article>
  );
}

export default function Announcements({ items }: { items: PublicLetter[] }) {
  const [cat, setCat] = useState<string>("");
  const [shown, setShown] = useState(PAGE);
  const filtered = cat ? items.filter((l) => l.category === cat) : items;

  return (
    <section id="announcements" className="ann-section">
      <div className="section-head">
        <h2>公告</h2>
        <p>同學們的匿名提問與學生會的回覆</p>
      </div>

      {items.length > 0 && (
        <div className="chips ann-filter">
          {["", ...CATEGORIES].map((c) => (
            <button
              key={c || "all"}
              type="button"
              className="chip chip-sm"
              aria-pressed={cat === c}
              onClick={() => { setCat(c); setShown(PAGE); }}
            >
              {c || "全部"}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card empty">目前還沒有公告</div>
      ) : (
        <>
          {filtered.slice(0, shown).map((l) => <Item key={l.id} l={l} />)}
          {filtered.length > shown && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShown(shown + PAGE)}>
                顯示更多（還有 {filtered.length - shown} 則）
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
