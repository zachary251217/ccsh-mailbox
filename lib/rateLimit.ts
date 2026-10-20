import { createHash, randomBytes } from "crypto";
import { LIMITS } from "./config";

// 只存在記憶體中、不寫入資料庫。IP 先加上隨機鹽再雜湊，伺服器重啟後即全部消失。
const salt = randomBytes(16).toString("hex");
const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const key = createHash("sha256").update(salt + ip).digest("hex");
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < LIMITS.rateWindowMs);
  if (recent.length >= LIMITS.rateMax) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= LIMITS.rateWindowMs)) hits.delete(k);
  }
  return false;
}
