// Uygulamanın kendi çizimleri: Hüdhüd kuşu ve kedi yavrusu.

// Tepelik tüyü: ucu siyah, altında beyaz bant olan uzun, ince bir tüy.
function CrestFeather({ angle, len }: { angle: number; len: number }) {
  const t = -len;
  return (
    <g transform={`translate(56 44) rotate(${angle})`}>
      <path d={`M-2 2 C-7 ${t * 0.35} -7.5 ${t * 0.8} 0 ${t} C7.5 ${t * 0.8} 7 ${t * 0.35} 2 2 Z`} fill="url(#hhCrest)" />
      <path d={`M-6.6 ${t * 0.72} Q0 ${t * 0.68} 6.6 ${t * 0.72} L6.3 ${t * 0.79} Q0 ${t * 0.75} -6.3 ${t * 0.79} Z`} fill="#fffaf0" />
      <path d={`M-6.3 ${t * 0.79} Q0 ${t * 0.75} 6.3 ${t * 0.79} C6 ${t * 0.92} 3 ${t * 0.99} 0 ${t} C-3 ${t * 0.99} -6 ${t * 0.92} -6.3 ${t * 0.79} Z`} fill="#231a17" />
      <path d={`M0 0 L0 ${t * 0.74}`} stroke="#c56a33" stroke-width="0.8" opacity=".6" />
    </g>
  );
}

export function Hudhud({ size = 110, talking = false, flip = false }: { size?: number; talking?: boolean; flip?: boolean }) {
  const crest: [number, number][] = [
    [-80, 28], [-60, 35], [-40, 40], [-20, 43], [0, 42], [20, 37], [40, 30],
  ];
  return (
    <svg
      class={`hudhud ${talking ? 'talking' : ''}`}
      width={size}
      height={size * 0.9}
      viewBox="0 0 160 144"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-label="Hüdhüd"
      role="img"
    >
      <defs>
        <radialGradient id="hhBody" cx="40%" cy="35%" r="75%">
          <stop offset="0" stop-color="#fbc690" />
          <stop offset=".55" stop-color="#eb9a5c" />
          <stop offset="1" stop-color="#c8703a" />
        </radialGradient>
        <radialGradient id="hhHead" cx="40%" cy="35%" r="70%">
          <stop offset="0" stop-color="#fcc996" />
          <stop offset="1" stop-color="#e38b4c" />
        </radialGradient>
        <linearGradient id="hhCrest" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#e98544" />
          <stop offset=".7" stop-color="#f7a868" />
          <stop offset="1" stop-color="#ffc088" />
        </linearGradient>
        <linearGradient id="hhBill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#5a4a44" />
          <stop offset="1" stop-color="#1f1715" />
        </linearGradient>
        <clipPath id="hhWingClip">
          <path d="M70 74 C88 62 118 66 136 84 C128 98 108 108 84 104 C74 96 68 86 70 74 Z" />
        </clipPath>
      </defs>

      {/* yer gölgesi */}
      <ellipse cx="92" cy="136" rx="34" ry="5" fill="#000" opacity=".12" />

      <g class="hh-body">
        {/* kuyruk */}
        <path d="M122 92 L158 118 Q156 126 148 126 L114 102 Z" fill="#231a17" />
        <path d="M134 101 L148 111 Q147 115 143 115 L130 106 Z" fill="#fffaf0" />

        {/* bacaklar */}
        <g stroke="#8c7569" stroke-width="3.2" stroke-linecap="round" fill="none">
          <path d="M84 106 L80 130 M80 130 l-7 2 M80 130 l1 4 M80 130 l6 1" />
          <path d="M98 106 L100 130 M100 130 l-7 2 M100 130 l1 4 M100 130 l6 1" />
        </g>

        {/* gövde ve göğüs */}
        <ellipse cx="90" cy="84" rx="40" ry="26" transform="rotate(-10 90 84)" fill="url(#hhBody)" />
        <path d="M58 84 C62 104 84 112 98 106 C84 104 68 96 58 84 Z" fill="#fde2c4" opacity=".9" />
        <g stroke="#d8955f" stroke-width="1.1" stroke-linecap="round" opacity=".55">
          <path d="M70 94 l3 4 M77 98 l3 4 M84 100 l2 4 M76 90 l2 3" />
        </g>

        {/* kanat: siyah-beyaz zebra desen */}
        <g clip-path="url(#hhWingClip)">
          <rect x="64" y="58" width="80" height="54" fill="#231a17" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path d={`M${86 + i * 11} 60 q-3 26 -13 52 l6 0 q10 -26 13 -52 Z`} fill="#fffaf0" />
          ))}
          <path d="M66 72 C86 58 120 62 140 82" stroke="#e99a5e" stroke-width="12" fill="none" />
          <path d="M70 78 C88 66 118 69 136 86" stroke="#231a17" stroke-width="2" fill="none" opacity=".5" />
        </g>
        <path d="M70 74 C88 62 118 66 136 84 C128 98 108 108 84 104 C74 96 68 86 70 74 Z" fill="none" stroke="#3b2a24" stroke-width=".9" />

        {/* tepelik */}
        <g class="hh-crest">
          {crest.map(([a, l]) => (
            <CrestFeather angle={a} len={l} />
          ))}
        </g>

        {/* baş ve boyun */}
        <path d="M44 64 C46 80 60 88 76 84 L70 60 Z" fill="url(#hhHead)" />
        <circle cx="54" cy="58" r="20" fill="url(#hhHead)" />

        {/* gaga: uzun, ince, aşağı kıvrık */}
        <path d="M37 59 C24 62 12 70 3 84 C14 74 26 67 38 66 Z" fill="url(#hhBill)" />
        <path d="M37 62 C26 65 16 71 8 79" stroke="#fff" stroke-width=".8" opacity=".25" fill="none" />

        {/* göz ve yanak */}
        <circle cx="46" cy="67" r="5" fill="#f58f8f" opacity=".45" />
        <g class="hh-eye">
          <circle cx="50" cy="55" r="6.4" fill="#fff8ee" />
          <circle cx="49.2" cy="55.4" r="4.4" fill="#2a1d17" />
          <circle cx="47.8" cy="53.8" r="1.6" fill="#fff" />
          <circle cx="50.6" cy="57" r=".7" fill="#fff" opacity=".8" />
        </g>
        <path d="M43 50 Q50 46 57 50" stroke="#c56a33" stroke-width="1.3" fill="none" opacity=".6" />
      </g>

      {/* konuşurken parıltılar */}
      <g class="hh-sparkles" fill="#ffd34d">
        <path d="M20 26 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" />
        <path d="M118 30 l1.5 4.5 4.5 1.5 -4.5 1.5 -1.5 4.5 -1.5 -4.5 -4.5 -1.5 4.5 -1.5 Z" />
        <circle cx="136" cy="56" r="2.4" />
      </g>
    </svg>
  );
}

export function Kitten({ size = 110, happy = false }: { size?: number; happy?: boolean }) {
  return (
    <svg class={`kitten ${happy ? 'happy' : ''}`} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Kedi yavrusu">
      <path class="k-tail" d="M70 82 Q92 80 90 60 Q89 50 82 52" stroke="#f0a65e" stroke-width="7" fill="none" stroke-linecap="round" />
      <ellipse cx="50" cy="74" rx="24" ry="20" fill="#f4b26a" />
      <ellipse cx="50" cy="80" rx="13" ry="11" fill="#fde3c3" />
      <ellipse cx="38" cy="92" rx="7" ry="4.5" fill="#f4b26a" />
      <ellipse cx="62" cy="92" rx="7" ry="4.5" fill="#f4b26a" />
      <path d="M30 30 L28 8 L46 22 Z" fill="#f4b26a" />
      <path d="M70 30 L72 8 L54 22 Z" fill="#f4b26a" />
      <path d="M32 26 L31 14 L41 22 Z" fill="#f7a8a8" />
      <path d="M68 26 L69 14 L59 22 Z" fill="#f7a8a8" />
      <circle cx="50" cy="40" r="23" fill="#f4b26a" />
      <path d="M44 19 q2 6 0 10 M50 18 v10 M56 19 q-2 6 0 10" stroke="#e08a3c" stroke-width="2.4" fill="none" stroke-linecap="round" />
      <g class="k-eyes">
        <ellipse cx="41" cy="40" rx="4.5" ry="5.5" fill="#2a2a2a" />
        <ellipse cx="59" cy="40" rx="4.5" ry="5.5" fill="#2a2a2a" />
        <circle cx="39.6" cy="38" r="1.6" fill="#fff" />
        <circle cx="57.6" cy="38" r="1.6" fill="#fff" />
      </g>
      <path class="k-happy-eyes" d="M36 41 q5 -6 10 0 M54 41 q5 -6 10 0" stroke="#2a2a2a" stroke-width="2.6" fill="none" stroke-linecap="round" />
      <circle cx="35" cy="48" r="3.5" fill="#f58f8f" opacity=".5" />
      <circle cx="65" cy="48" r="3.5" fill="#f58f8f" opacity=".5" />
      <path d="M47.5 46 h5 l-2.5 3 Z" fill="#e77" />
      <path d="M45 51 q2.5 3 5 0 q2.5 3 5 0" stroke="#7a4a3a" stroke-width="1.6" fill="none" stroke-linecap="round" />
      <path d="M30 46 l-12 -2 M30 50 l-12 2 M70 46 l12 -2 M70 50 l12 2" stroke="#b88" stroke-width="1.2" stroke-linecap="round" />
    </svg>
  );
}
