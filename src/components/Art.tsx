// Uygulamanın kendi çizimleri: Hüdhüd kuşu ve kedi yavrusu.

export function Hudhud({ size = 110, talking = false, flip = false }: { size?: number; talking?: boolean; flip?: boolean }) {
  const crest = [-62, -40, -18, 4, 26];
  return (
    <svg
      class={`hudhud ${talking ? 'talking' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-label="Hüdhüd"
      role="img"
    >
      <defs>
        <clipPath id="wingClip">
          <ellipse cx="76" cy="76" rx="24" ry="15" transform="rotate(-14 76 76)" />
        </clipPath>
      </defs>
      <g class="hh-body">
        {/* kuyruk */}
        <path d="M92 80 L116 98 L110 104 L86 88 Z" fill="#2b2b2b" />
        <path d="M101 87 L111 95 L108 98 L98 90 Z" fill="#fff" />
        {/* bacaklar */}
        <path d="M56 92 L54 108 M68 92 L70 108" stroke="#8a6a55" stroke-width="3" stroke-linecap="round" />
        <path d="M49 108 h10 M65 108 h10" stroke="#8a6a55" stroke-width="3" stroke-linecap="round" />
        {/* gövde */}
        <ellipse cx="62" cy="74" rx="32" ry="23" fill="#f2a66b" />
        <ellipse cx="54" cy="80" rx="18" ry="12" fill="#f7c497" />
        {/* kanat: siyah-beyaz çizgili */}
        <g clip-path="url(#wingClip)">
          <rect x="50" y="56" width="56" height="40" fill="#2b2b2b" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect x={62 + i * 9} y="56" width="4" height="40" fill="#fff" transform={`rotate(14 ${64 + i * 9} 76)`} />
          ))}
        </g>
        {/* tepelik */}
        <g class="hh-crest">
          {crest.map((a) => (
            <g transform={`rotate(${a} 42 38)`}>
              <ellipse cx="42" cy="22" rx="4.6" ry="13" fill="#f08a4b" />
              <ellipse cx="42" cy="14" rx="4" ry="2.2" fill="#fff" />
              <ellipse cx="42" cy="10" rx="3.6" ry="3.6" fill="#2b2b2b" />
            </g>
          ))}
        </g>
        {/* baş */}
        <circle cx="40" cy="50" r="18" fill="#f2a66b" />
        {/* gaga */}
        <path d="M25 52 Q12 56 2 66 Q14 58 26 57 Z" fill="#4a4040" />
        {/* yanak ve göz */}
        <circle cx="34" cy="58" r="4.5" fill="#f58f8f" opacity=".55" />
        <g class="hh-eye">
          <circle cx="38" cy="47" r="6" fill="#fff" />
          <circle cx="37" cy="47.5" r="3.6" fill="#222" />
          <circle cx="35.8" cy="46" r="1.3" fill="#fff" />
        </g>
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
