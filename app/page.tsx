import LetterForm from "@/components/LetterForm";
import { SITE_TITLE } from "@/lib/config";

export default function Home() {
  return (
    <>
      <header className="hero">
        <div className="container">
          <span className="hero-badge">✉ 不需登入・完全匿名</span>
          <h1>{SITE_TITLE}</h1>
          <p>對學校、活動或學生會有任何想法，都可以寫下來告訴我們。</p>
        </div>
      </header>

      <main className="container">
        <section className="card main-card">
          <LetterForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </section>

        <ul className="privacy">
          <li>
            <span className="privacy-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /><path d="M3 3l18 18" /></svg>
            </span>
            <span><strong>不需登入</strong>不用帳號、不填姓名或學號</span>
          </li>
          <li>
            <span className="privacy-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            </span>
            <span><strong>不記錄 IP</strong>資料庫只存信件內容與分類</span>
          </li>
          <li>
            <span className="privacy-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><path d="M4 4l16 16" /></svg>
            </span>
            <span><strong>附件去識別化</strong>自動移除照片位置、拍攝資訊與檔名</span>
          </li>
        </ul>
      </main>

      <footer className="footer">中正高中學生會</footer>
    </>
  );
}
