// Bahçenin arka planı: gökyüzü, tepeler, çiftlik evi, ahır, ağaçlar ve çit.

function Tree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) {
  const g = ['#5fb85a', '#4fa64e', '#6cc46a'][tone % 3];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="16" ry="4" fill="#2f6b2f" opacity=".25" />
      <rect x="-3" y="-18" width="6" height="20" rx="2" fill="#8a5a36" />
      <circle cx="0" cy="-30" r="15" fill={g} />
      <circle cx="-10" cy="-22" r="10" fill={g} />
      <circle cx="10" cy="-22" r="10" fill={g} />
      <circle cx="-5" cy="-36" r="7" fill="#fff" opacity=".18" />
    </g>
  );
}

export function FarmScene() {
  return (
    <svg class="farm-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7cc8f2" />
          <stop offset="1" stop-color="#d8f1ff" />
        </linearGradient>
        <linearGradient id="fHillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9fd88a" />
          <stop offset="1" stop-color="#86c873" />
        </linearGradient>
        <linearGradient id="fHillNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8fd06e" />
          <stop offset="1" stop-color="#6fb653" />
        </linearGradient>
        <linearGradient id="fWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff6e2" />
          <stop offset="1" stop-color="#f0dfbd" />
        </linearGradient>
        <linearGradient id="fWallSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e9d5ad" />
          <stop offset="1" stop-color="#d8c094" />
        </linearGradient>
        <linearGradient id="fRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e2584a" />
          <stop offset="1" stop-color="#b83c32" />
        </linearGradient>
        <linearGradient id="fBarn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d9534a" />
          <stop offset="1" stop-color="#b03f37" />
        </linearGradient>
        <radialGradient id="fSun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#fff6b0" />
          <stop offset=".6" stop-color="#ffd84d" />
          <stop offset="1" stop-color="#ffd84d" stop-opacity="0" />
        </radialGradient>
      </defs>

      {/* gökyüzü, güneş, bulutlar */}
      <rect width="400" height="300" fill="url(#fSky)" />
      <circle class="f-sun" cx="62" cy="48" r="38" fill="url(#fSun)" />
      <circle cx="62" cy="48" r="18" fill="#ffe066" />
      <g class="f-cloud" fill="#fff" opacity=".95">
        <ellipse cx="170" cy="40" rx="26" ry="11" />
        <ellipse cx="190" cy="34" rx="18" ry="12" />
        <ellipse cx="152" cy="36" rx="14" ry="9" />
      </g>
      <g class="f-cloud slow" fill="#fff" opacity=".85">
        <ellipse cx="320" cy="26" rx="22" ry="9" />
        <ellipse cx="336" cy="21" rx="14" ry="9" />
      </g>

      {/* tepeler */}
      <path d="M0 132 Q70 92 150 120 T300 108 T400 118 V300 H0 Z" fill="url(#fHillFar)" />
      <path d="M0 150 Q100 118 210 140 T400 136 V300 H0 Z" fill="url(#fHillNear)" />

      {/* ahır (solda) */}
      <g transform="translate(28 96)">
        <path d="M0 30 L32 6 L64 30 Z" fill="#8f2f29" />
        <rect x="2" y="28" width="60" height="44" fill="url(#fBarn)" />
        <path d="M0 30 L32 6 L64 30" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round" />
        <rect x="20" y="44" width="24" height="28" fill="#7e2a24" />
        <path d="M20 44 L44 72 M44 44 L20 72" stroke="#fff" stroke-width="2.4" />
        <rect x="20" y="44" width="24" height="28" fill="none" stroke="#fff" stroke-width="2.4" />
        <rect x="27" y="17" width="10" height="9" fill="#fff3d6" stroke="#fff" stroke-width="1.5" />
        {/* saman balyası */}
        <rect x="66" y="58" width="22" height="14" rx="3" fill="#f2c94c" />
        <path d="M70 62 h14 M70 66 h14" stroke="#d9a92a" stroke-width="1.2" />
      </g>

      <Tree x={120} y={150} s={0.9} tone={1} />
      <Tree x={384} y={146} s={0.85} tone={2} />

      {/* çiftlik evi (sağda) */}
      <g transform="translate(222 70)">
        {/* yan duvar (derinlik) */}
        <path d="M112 47 L140 36 L140 95 L112 106 Z" fill="url(#fWallSide)" />
        <path d="M63 4 L93 -8 L152 38 L122 50 Z" fill="#a8362d" />
        <path d="M93 -8 L152 38" stroke="#8f2f29" stroke-width="3" stroke-linecap="round" />
        {/* ön duvar */}
        <rect x="14" y="46" width="98" height="60" fill="url(#fWall)" />
        <g stroke="#e3cfa6" stroke-width="1">
          <path d="M14 58 h98 M14 70 h98 M14 82 h98 M14 94 h98" />
        </g>
        {/* çatı */}
        <path d="M4 50 L63 4 L122 50 Z" fill="url(#fRoof)" />
        <path d="M4 50 L63 4 L122 50" stroke="#8f2f29" stroke-width="3" fill="none" stroke-linejoin="round" />
        <path d="M63 4 L93 -8" stroke="#8f2f29" stroke-width="3" stroke-linecap="round" />
        {/* baca ve duman */}
        <rect x="34" y="8" width="12" height="22" fill="#9a6b4f" />
        <rect x="32" y="5" width="16" height="5" fill="#7d533b" />
        <g class="f-smoke" fill="#fff" opacity=".8">
          <circle cx="40" cy="-4" r="5" />
          <circle cx="34" cy="-14" r="6" />
          <circle cx="28" cy="-24" r="7" />
        </g>
        {/* çatı penceresi */}
        <circle cx="63" cy="30" r="8" fill="#bfe6ff" stroke="#fff" stroke-width="3" />
        <path d="M63 22 v16 M55 30 h16" stroke="#fff" stroke-width="1.6" />
        {/* kapı */}
        <path d="M52 106 V78 Q63 68 74 78 V106 Z" fill="#8a5a36" />
        <path d="M52 106 V78 Q63 68 74 78 V106" fill="none" stroke="#6d4428" stroke-width="2" />
        <circle cx="69" cy="92" r="1.8" fill="#ffd34d" />
        <rect x="46" y="104" width="34" height="5" rx="2" fill="#c9b08a" />
        {/* pencereler ve çiçek saksıları */}
        {[22, 86].map((x) => (
          <g>
            <rect x={x} y="60" width="20" height="18" fill="#bfe6ff" stroke="#fff" stroke-width="3" />
            <path d={`M${x + 10} 60 v18 M${x} 69 h20`} stroke="#fff" stroke-width="1.6" />
            <rect x={x - 4} y="56" width="5" height="26" fill="#5fa8d3" />
            <rect x={x + 19} y="56" width="5" height="26" fill="#5fa8d3" />
            <rect x={x - 1} y="78" width="22" height="6" rx="2" fill="#a5643a" />
            <circle cx={x + 3} cy="76" r="2.6" fill="#ff7aa8" />
            <circle cx={x + 10} cy="75" r="2.6" fill="#ffd34d" />
            <circle cx={x + 17} cy="76" r="2.6" fill="#ff7aa8" />
          </g>
        ))}
        {/* yan pencere */}
        <path d="M120 60 L132 55 L132 71 L120 76 Z" fill="#a9d6f0" stroke="#fff" stroke-width="2" />
      </g>

      {/* evden inen yol */}
      <path d="M276 180 Q282 200 300 300 H250 Q262 220 268 180 Z" fill="#e8d3a2" opacity=".9" />

      {/* çit */}
      <g>
        <rect x="0" y="168" width="400" height="4" fill="#fff" />
        <rect x="0" y="180" width="400" height="4" fill="#fff" />
        {Array.from({ length: 21 }, (_, i) => (
          <path d={`M${i * 20 + 4} 190 V162 l4 -5 4 5 V190 Z`} fill="#fffdf6" stroke="#e5dcc8" stroke-width="1" />
        ))}
      </g>

      {/* ön çimen */}
      <rect x="0" y="188" width="400" height="112" fill="#7cc45e" />
      <g fill="#6bb44f">
        {Array.from({ length: 26 }, (_, i) => (
          <path d={`M${(i * 37) % 400} ${200 + ((i * 53) % 90)} l3 -8 3 8 Z`} />
        ))}
      </g>
    </svg>
  );
}
