"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { STATUSES, Status } from "@/lib/config";

export default function StatusSelect({ id, value }: { id: string; value: Status }) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [pending, startTransition] = useTransition();

  async function change(next: Status) {
    const prev = current;
    setCurrent(next);
    const res = await fetch(`/api/admin/letters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setCurrent(prev);
      alert("更新失敗，請重新整理後再試。");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      狀態
      <select
        className="status-select"
        value={current}
        disabled={pending}
        onChange={(e) => change(e.target.value as Status)}
      >
        {(Object.keys(STATUSES) as Status[]).map((s) => (
          <option key={s} value={s}>{STATUSES[s]}</option>
        ))}
      </select>
    </label>
  );
}
