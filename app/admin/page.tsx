import { auth, devBypass, isAdmin, signIn, signOut } from "@/auth";
import { CATEGORIES, SITE_TITLE, STATUSES, Status } from "@/lib/config";
import { store } from "@/lib/store";
import StatusSelect from "@/components/StatusSelect";

export const dynamic = "force-dynamic";
export const metadata = { title: `後台｜${SITE_TITLE}` };

type Search = { status?: string; category?: string; q?: string; error?: string };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function LoginPage({ error }: { error?: string }) {
  return (
    <main className="container">
      <div className="card login">
        <img className="login-logo" src="/logo.png" alt="中正高中校徽" />
        <h1>學生會後台</h1>
        <p>請使用學生會會帳登入</p>
        {error && <div className="error">此帳號沒有權限，請改用學生會會帳登入。</div>}
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/admin" }); }}>
          <button className="btn btn-primary btn-block" type="submit">使用 Google 帳號登入</button>
        </form>
      </div>
    </main>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  if (!(await isAdmin())) return <LoginPage error={sp.error} />;

  const session = devBypass ? null : await auth();
  const all = await store.list();

  const counts = Object.fromEntries(
    (Object.keys(STATUSES) as Status[]).map((s) => [s, all.filter((l) => l.status === s).length]),
  ) as Record<Status, number>;

  const status = sp.status && sp.status in STATUSES ? (sp.status as Status) : null;
  const q = sp.q?.trim().toLowerCase() ?? "";
  const letters = all.filter(
    (l) =>
      (status ? l.status === status : l.status !== "archived") &&
      (!sp.category || l.category === sp.category) &&
      (!q || l.content.toLowerCase().includes(q) || (l.title ?? "").toLowerCase().includes(q)),
  );

  const linkWith = (s: Status | null) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (sp.category) p.set("category", sp.category);
    if (sp.q) p.set("q", sp.q);
    const str = p.toString();
    return str ? `/admin?${str}` : "/admin";
  };

  return (
    <>
      {devBypass && <div className="dev-banner">開發預覽模式：尚未設定 Google 登入，後台目前不需驗證</div>}
      <header className="admin-bar">
        <div className="container-wide">
          <h1><img src="/logo-white.png" alt="" />{SITE_TITLE}・後台</h1>
          <div className="who">
            {session?.user?.email && <span>{session.user.email}</span>}
            {!devBypass && (
              <form action={async () => { "use server"; await signOut({ redirectTo: "/admin" }); }}>
                <button className="btn btn-ghost" type="submit">登出</button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="container-wide">
        <div className="stats">
          {(Object.keys(STATUSES) as Status[]).map((s) => (
            <a key={s} href={linkWith(status === s ? null : s)} className={`card stat${status === s ? " active" : ""}`}>
              <div className="n">{counts[s]}</div>
              <div className="t">{STATUSES[s]}</div>
            </a>
          ))}
        </div>

        <form className="filters" method="get">
          {status && <input type="hidden" name="status" value={status} />}
          <input className="input" name="q" placeholder="搜尋標題或內容" defaultValue={sp.q ?? ""} />
          <select className="input" name="category" defaultValue={sp.category ?? ""}>
            <option value="">全部分類</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-ghost" type="submit">篩選</button>
        </form>

        {letters.length === 0 ? (
          <div className="card empty">目前沒有符合條件的信件</div>
        ) : (
          letters.map((l) => (
            <article key={l.id} className={`card letter${l.status === "new" ? " is-new" : ""}`}>
              <div className="letter-head">
                <span className="tag">{l.category}</span>
                <span className="time">{fmt(l.created_at)}</span>
              </div>
              {l.title && <h3>{l.title}</h3>}
              <p className="letter-body">{l.content}</p>
              {l.attachments.length > 0 && (
                <div className="atts">
                  {l.attachments.map((a, i) => {
                    const src = `/api/admin/files/${l.id}/${i}`;
                    return (
                      <a key={i} className="att" href={src} target="_blank" rel="noreferrer" title={a.name}>
                        {a.type.startsWith("image/") && a.type !== "image/heic" ? <img src={src} alt={a.name} /> : "PDF"}
                      </a>
                    );
                  })}
                </div>
              )}
              <div className="letter-foot">
                <StatusSelect id={l.id} value={l.status} />
              </div>
            </article>
          ))
        )}
        <div style={{ height: 40 }} />
      </main>
    </>
  );
}
