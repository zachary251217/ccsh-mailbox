/**
 * 敏感訊息阻擋：不當用語＋個人資料
 * 前端（即時提示）與後端（真正把關）共用同一份規則。
 * 要新增或移除詞彙，直接修改下面的清單即可。
 */

// 中文不當用語（比對前會先移除空白與符號、轉小寫，所以「幹 你 娘」「幹.你.娘」也會被擋）
const BLOCKED_WORDS = [
  "幹你娘", "干你娘", "幹您娘", "幹你老師", "操你媽", "操你妈", "操你娘", "肏",
  "雞掰", "機掰", "鸡掰", "雞巴", "鸡巴", "ㄐㄅ", "靠北", "靠杯", "靠夭",
  "他媽的", "他妈的", "你媽的", "你妈的", "去你媽", "你娘咧",
  "白癡", "白痴", "智障", "腦殘", "脑残", "低能兒", "弱智",
  "死全家", "全家死光", "婊子", "賤人", "贱人", "賤貨", "破麻",
  "王八蛋", "廢物", "妓女", "屌你",
];

// 英文以「完整單字」比對，避免 "habit change" 這類誤判
const BLOCKED_EN = /\b(fuck\w*|fxck|shit|bitch\w*|asshole|motherfucker|dick|nmsl|cnmb|wtf)\b/i;

// 個人資料：避免投信者不小心洩漏自己（或他人）的身分
const PII_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/, label: "手機號碼" },
  { re: /\b[A-Z][12489]\d{8}\b/i, label: "身分證字號" },
  { re: /[\w.+-]+@[\w-]+\.[\w.-]+/, label: "Email" },
  { re: /line\s*(id)?\s*[:：]|賴\s*[:：]/i, label: "LINE ID" },
  { re: /(ig|instagram)\s*[:：@]/i, label: "IG 帳號" },
];

function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}_]/gu, "");
}

export type ModerationResult = { ok: true } | { ok: false; message: string };

export function checkContent(...texts: string[]): ModerationResult {
  const raw = texts.join("\n");

  const pii = PII_PATTERNS.find((p) => p.re.test(raw.normalize("NFKC")));
  if (pii) {
    return { ok: false, message: `為了保護匿名，內容中請不要留下${pii.label}等個人資料。` };
  }

  const en = raw.normalize("NFKC").match(BLOCKED_EN);
  if (en) {
    return { ok: false, message: `內容含有不當用語「${en[0]}」，請修改後再送出。` };
  }

  const norm = normalize(raw);
  const word = BLOCKED_WORDS.find((w) => norm.includes(normalize(w)));
  if (word) {
    return { ok: false, message: `內容含有不當用語「${word}」，請修改後再送出。` };
  }

  return { ok: true };
}
