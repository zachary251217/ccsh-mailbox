/* 首頁裝飾插圖：信封、紙飛機、郵票、郵戳 */

function Envelope({ x, y, s = 1, r = 0, o = 0.22 }: { x: number; y: number; s?: number; r?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <rect x="-30" y="-20" width="60" height="40" rx="4" />
      <path d="M-28 -17 L0 4 L28 -17" />
      <path d="M-28 18 L-8 -2 M28 18 L8 -2" />
    </g>
  );
}

function Plane({ x, y, s = 1, r = 0, o = 0.3 }: { x: number; y: number; s?: number; r?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <path d="M-24 0 L24 -18 L10 20 L2 6 Z" />
      <path d="M2 6 L24 -18" />
      <path d="M2 6 L0 16 L6 10" />
    </g>
  );
}

function Stamp({ x, y, s = 1, r = 0, o = 0.2 }: { x: number; y: number; s?: number; r?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <rect x="-22" y="-28" width="44" height="56" strokeDasharray="0.1 6" strokeWidth="5" />
      <rect x="-15" y="-21" width="30" height="42" />
      <path d="M-9 9 L-2 0 L3 6 L6 3 L10 9 Z" />
      <circle cx="5" cy="-9" r="3.5" />
    </g>
  );
}

function Sparkle({ x, y, s = 1, o = 0.35 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      opacity={o}
      d="M0 -8 Q1 -1 8 0 Q1 1 0 8 Q-1 1 -8 0 Q-1 -1 0 -8 Z"
      fill="currentColor"
      stroke="none"
    />
  );
}

function Heart({ x, y, s = 1, r = 0, o = 0.3 }: { x: number; y: number; s?: number; r?: number; o?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
      opacity={o}
      d="M0 6 C-10 -2 -8 -10 -3 -10 C-1 -10 0 -8 0 -7 C0 -8 1 -10 3 -10 C8 -10 10 -2 0 6 Z"
    />
  );
}

export function HeroDecor() {
  return (
    <svg className="hero-decor" viewBox="0 0 1200 380" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* 紙飛機飛行軌跡 */}
        <path d="M-20 330 C 180 240, 260 360, 470 280 S 820 120, 1010 150" strokeDasharray="2 10" opacity="0.28" />
        <path d="M80 120 C 140 60, 220 90, 270 50" strokeDasharray="2 9" opacity="0.2" />

        <Plane x={1040} y={138} s={1.5} r={-8} o={0.45} />
        <Plane x={300} y={42} s={0.9} r={-20} o={0.3} />

        <Envelope x={110} y={250} s={1.3} r={-14} />
        <Envelope x={1120} y={290} s={1.5} r={12} o={0.18} />
        <Envelope x={860} y={320} s={0.9} r={-6} o={0.16} />
        <Envelope x={940} y={50} s={0.8} r={16} o={0.16} />

        <Stamp x={1150} y={70} s={1.1} r={10} />
        <Stamp x={40} y={70} s={0.9} r={-8} o={0.16} />

        <Heart x={700} y={70} s={1.4} r={-12} o={0.22} />
        <Heart x={210} y={330} s={1} r={14} o={0.2} />
      </g>
      <g color="#fff">
        <Sparkle x={620} y={40} s={1.2} />
        <Sparkle x={780} y={210} s={0.9} o={0.25} />
        <Sparkle x={1080} y={210} s={1.1} />
        <Sparkle x={380} y={130} s={0.8} o={0.25} />
        <Sparkle x={160} y={170} s={0.7} o={0.25} />
      </g>
    </svg>
  );
}

/** 卡片右上角的郵戳 */
export function Postmark() {
  return (
    <svg className="postmark" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <path id="pm-circle" d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="60" cy="60" r="54" />
        <circle cx="60" cy="60" r="31" strokeWidth="1.5" />
      </g>
      <text fill="currentColor" fontSize="12.5" fontWeight="700" letterSpacing="7.2">
        <textPath href="#pm-circle">中正高中學生會・匿名信箱・</textPath>
      </text>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" transform="translate(60 60)">
        <rect x="-15" y="-10" width="30" height="20" rx="2" />
        <path d="M-14 -8 L0 3 L14 -8" />
      </g>
    </svg>
  );
}
