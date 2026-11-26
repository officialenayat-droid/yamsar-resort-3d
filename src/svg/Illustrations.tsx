import type { SVGProps } from 'react'

/** The Yamsar Resort crest: river, deodar, peaks and a saffron sun inside a lettered roundel. */
export function Crest({ size = 220, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} role="img" aria-label="The Yamsar Resort crest" {...rest}>
      <defs>
        <path id="crest-arc-top" d="M 30 120 A 90 90 0 0 1 210 120" />
        <path id="crest-arc-bot" d="M 36 128 A 84 84 0 0 0 204 128" />
        <clipPath id="crest-clip">
          <circle cx="120" cy="120" r="70" />
        </clipPath>
        <linearGradient id="crest-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c4a3f" />
          <stop offset="1" stopColor="#1c352d" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="116" fill="#f8f3ea" stroke="#6E473B" strokeWidth="2" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="#6E473B" strokeWidth="0.8" strokeDasharray="2 4" />
      <circle cx="120" cy="120" r="76" fill="none" stroke="#6E473B" strokeWidth="1.4" />
      <text fill="#6E473B" fontFamily="var(--font-display)" fontSize="15" fontWeight="600" letterSpacing="5" textAnchor="middle">
        <textPath href="#crest-arc-top" startOffset="50%">THE YAMSAR RESORT</textPath>
      </text>
      <text fill="#2B7A78" fontFamily="var(--font-sans)" fontSize="10" fontWeight="600" letterSpacing="4" textAnchor="middle">
        <textPath href="#crest-arc-bot" startOffset="50%">KULLAN · SONAMARG · KASHMIR</textPath>
      </text>
      <circle cx="40" cy="124" r="2.5" fill="#D96B27" />
      <circle cx="200" cy="124" r="2.5" fill="#D96B27" />
      <g clipPath="url(#crest-clip)">
        <rect x="40" y="40" width="160" height="160" fill="url(#crest-sky)" />
        <circle cx="152" cy="86" r="11" fill="#D96B27" />
        <path d="M44 150 L82 96 L98 116 L120 78 L146 118 L160 104 L200 150 Z" fill="#e9e4da" />
        <path d="M82 96 L90 107 L84 106 L78 110 L74 107 Z M120 78 L131 95 L123 92 L116 97 L110 93 Z M160 104 L167 114 L160 112 L154 114 Z" fill="#ffffff" />
        <path d="M44 150 L82 96 L76 150 Z M120 78 L108 150 L98 116 Z" fill="#cfd6d3" opacity="0.7" />
        <path d="M40 150 H200 V200 H40 Z" fill="#2c5140" />
        <path d="M52 176 C 80 160, 100 190, 124 172 S 170 160, 196 178" stroke="#2B7A78" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M60 174 C 84 162, 102 186, 124 170" stroke="#9fd4cd" strokeWidth="2" fill="none" strokeLinecap="round" />
        <g fill="#14281f">
          <path d="M70 160 l-9 0 l9 -14 l-7 0 l7 -12 l-5 0 l5 -10 l5 10 l-5 0 l7 12 l-7 0 l9 14 z" />
          <path d="M176 162 l-8 0 l8 -12 l-6 0 l6 -10 l-4 0 l4 -9 l4 9 l-4 0 l6 10 l-6 0 l8 12 z" />
        </g>
        <path d="M102 160 L114 146 L126 160 Z" fill="#6E473B" />
        <path d="M108 160 L114 152 L120 160 Z" fill="#f6b45f" />
      </g>
    </svg>
  )
}

/** Rustam — a Kashmiri red fox in a karakul cap and embroidered scarf. */
export function RustamFox({ mood = 'happy', className }: { mood?: 'happy' | 'worried' | 'proud'; className?: string }) {
  return (
    <svg viewBox="0 0 260 300" className={className} role="img" aria-label="Rustam the fox">
      {/* tail */}
      <g className="wag">
        <path d="M168 250 C 240 250, 258 170, 222 130 C 214 176, 196 210, 150 222 Z" fill="#c4572b" />
        <path d="M222 130 C 236 150, 236 176, 226 196 C 220 176, 214 156, 222 130 Z" fill="#fbf4ea" />
      </g>
      {/* body */}
      <path d="M78 262 C 60 200, 82 150, 130 146 C 178 150, 198 200, 182 262 Z" fill="#d0612f" />
      <path d="M104 262 C 98 214, 112 176, 130 172 C 148 176, 162 214, 156 262 Z" fill="#fbf4ea" />
      {/* paws */}
      <ellipse cx="104" cy="264" rx="20" ry="10" fill="#3b2621" />
      <ellipse cx="156" cy="264" rx="20" ry="10" fill="#3b2621" />
      {/* scarf with sozni embroidery */}
      <path d="M86 150 C 110 166, 150 166, 176 150 L 172 170 C 148 182, 112 182, 90 170 Z" fill="#1C352D" />
      <path d="M150 170 L 164 214 L 146 210 L 140 172 Z" fill="#1C352D" />
      {[100, 116, 132, 148, 162].map((x) => (
        <circle key={x} cx={x} cy={166 + Math.abs(x - 131) * 0.08} r="2.5" fill="#D96B27" />
      ))}
      <circle cx="152" cy="196" r="3" fill="#e8c36a" />
      {/* head */}
      <path d="M70 92 L 58 34 L 104 66 Z" fill="#c4572b" />
      <path d="M190 92 L 202 34 L 156 66 Z" fill="#c4572b" />
      <path d="M72 82 L 64 46 L 94 68 Z" fill="#3b2621" opacity="0.8" />
      <path d="M188 82 L 196 46 L 166 68 Z" fill="#3b2621" opacity="0.8" />
      <path d="M130 56 C 178 56, 204 90, 196 120 C 186 148, 156 158, 130 162 C 104 158, 74 148, 64 120 C 56 90, 82 56, 130 56 Z" fill="#d86a34" />
      <path d="M130 108 C 150 108, 182 116, 190 124 C 176 150, 150 160, 130 162 C 110 160, 84 150, 70 124 C 78 116, 110 108, 130 108 Z" fill="#fbf4ea" />
      {/* karakul cap */}
      <path d="M92 68 C 96 40, 164 40, 168 68 C 150 62, 110 62, 92 68 Z" fill="#4a3a33" />
      <path d="M96 62 C 110 56, 150 56, 164 62" stroke="#6b574c" strokeWidth="3" fill="none" strokeDasharray="3 4" strokeLinecap="round" />
      {/* eyes */}
      {mood === 'proud' ? (
        <>
          <path d="M98 104 q 10 -10 20 0" stroke="#2b241f" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M142 104 q 10 -10 20 0" stroke="#2b241f" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <g className="blink">
            <ellipse cx="108" cy="102" rx="7" ry="9" fill="#2b241f" />
            <ellipse cx="152" cy="102" rx="7" ry="9" fill="#2b241f" />
            <circle cx="110" cy="98" r="2.4" fill="#fff" />
            <circle cx="154" cy="98" r="2.4" fill="#fff" />
          </g>
          {mood === 'worried' && (
            <>
              <path d="M96 86 l 18 6" stroke="#3b2621" strokeWidth="3" strokeLinecap="round" />
              <path d="M164 86 l -18 6" stroke="#3b2621" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </>
      )}
      <ellipse cx="130" cy="124" rx="9" ry="6.5" fill="#2b241f" />
      {mood === 'worried' ? (
        <path d="M118 142 q 12 -6 24 0" stroke="#2b241f" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M118 136 q 6 8 12 0 q 6 8 12 0" stroke="#2b241f" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      <ellipse cx="92" cy="126" rx="9" ry="5" fill="#f19a7a" opacity="0.55" />
      <ellipse cx="168" cy="126" rx="9" ry="5" fill="#f19a7a" opacity="0.55" />
    </svg>
  )
}

/** Engraved copper samovar. `level` 0..1 tints the brew; `boiling` adds bubbles + steam. */
export function Samovar({ boiling, tint, className }: { boiling: boolean; tint: number; className?: string }) {
  const brew = `rgb(${Math.round(200 + 30 * tint)}, ${Math.round(170 - 40 * tint)}, ${Math.round(110 - 70 * tint)})`
  return (
    <svg viewBox="0 0 220 300" className={className} role="img" aria-label="Copper samovar">
      <defs>
        <linearGradient id="copper" x1="0" x2="1">
          <stop offset="0" stopColor="#7d3f1f" />
          <stop offset="0.35" stopColor="#d9884e" />
          <stop offset="0.55" stopColor="#f2b07a" />
          <stop offset="1" stopColor="#8a4523" />
        </linearGradient>
      </defs>
      {boiling && (
        <g fill="#ffffff" opacity="0.55">
          <circle className="steam" cx="110" cy="40" r="10" />
          <circle className="steam" cx="100" cy="48" r="8" style={{ animationDelay: '-1s' }} />
          <circle className="steam" cx="120" cy="46" r="7" style={{ animationDelay: '-2s' }} />
        </g>
      )}
      {/* chimney + lid */}
      <rect x="100" y="38" width="20" height="26" rx="3" fill="#5a2e18" />
      <path d="M78 74 C 82 58, 138 58, 142 74 Z" fill="url(#copper)" />
      <circle cx="110" cy="56" r="5" fill="#f2b07a" />
      {/* handles */}
      <path d="M44 104 C 20 104, 20 150, 44 150" stroke="#5a2e18" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M176 104 C 200 104, 200 150, 176 150" stroke="#5a2e18" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* body */}
      <path d="M60 76 H160 C 186 110, 186 170, 160 200 H60 C 34 170, 34 110, 60 76 Z" fill="url(#copper)" />
      {/* the brew, seen through an open lid "window" */}
      <ellipse cx="110" cy="84" rx="42" ry="8" fill={brew} />
      {boiling &&
        [86, 104, 122, 134].map((x, i) => <circle key={x} className="bubble" cx={x} cy="86" r="3.5" fill="#fff6e6" style={{ animationDelay: `${-i * 0.27}s` }} />)}
      {/* engraved bands (naqashi) */}
      <path d="M50 110 H170" stroke="#7a3c1c" strokeWidth="2" />
      <path d="M48 168 H172" stroke="#7a3c1c" strokeWidth="2" />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${58 + i * 13} 124 q 6 -10 12 0 q -6 10 -12 0`} fill="none" stroke="#7a3c1c" strokeWidth="1.6" />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={i} cx={66 + i * 18} cy="150" r="5" fill="none" stroke="#7a3c1c" strokeWidth="1.6" />
      ))}
      {/* spout + tap */}
      <path d="M160 176 H196 v10 H172" fill="#7a3c1c" />
      <rect x="186" y="186" width="8" height="12" fill="#5a2e18" />
      {/* base */}
      <path d="M70 200 H150 L140 226 H80 Z" fill="#8a4523" />
      <path d="M60 226 H160 V240 H60 Z" fill="#5a2e18" />
      <path d="M84 240 L74 262 M136 240 L146 262" stroke="#5a2e18" strokeWidth="8" strokeLinecap="round" />
      {/* coals glow */}
      <ellipse cx="110" cy="212" rx="22" ry="6" fill="#ff8f3a" opacity={boiling ? 0.95 : 0.4} />
    </svg>
  )
}

/** Illustrated front of the Sonamarg keepsake postcard. */
export function PostcardArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 400" className={className} role="img" aria-label="Greetings from Sonamarg illustration" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="pc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ab8cf" />
          <stop offset="0.7" stopColor="#f3e3c8" />
          <stop offset="1" stopColor="#f6d6a8" />
        </linearGradient>
        <linearGradient id="pc-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fc5bd" />
          <stop offset="1" stopColor="#2B7A78" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#pc-sky)" />
      <circle cx="470" cy="92" r="34" fill="#D96B27" opacity="0.9" />
      {/* back peaks */}
      <path d="M-10 250 L70 120 L120 170 L190 70 L260 160 L320 100 L400 190 L460 110 L540 180 L610 120 L610 260 Z" fill="#8a9aa6" />
      <path d="M70 120 L88 150 L74 146 L60 152 L52 148 Z M190 70 L214 108 L196 102 L182 112 L168 104 Z M320 100 L340 130 L324 124 L310 132 Z M460 110 L478 138 L462 134 L450 140 Z" fill="#fff" />
      {/* mid ridge */}
      <path d="M-10 290 L60 210 L130 250 L210 190 L290 250 L360 210 L440 260 L520 220 L610 270 L610 310 L-10 310 Z" fill="#4f6f5a" />
      {/* meadow */}
      <path d="M-10 300 C 120 280, 220 300, 300 296 S 500 280, 610 296 V400 H-10 Z" fill="#86a35c" />
      {/* river */}
      <path d="M250 300 C 300 320, 210 350, 280 372 S 360 400, 330 410 L 420 410 C 420 380, 340 360, 380 340 S 330 305, 300 298 Z" fill="url(#pc-river)" />
      <path d="M290 330 q 20 6 30 0 M300 360 q 24 8 40 0" stroke="#e6f6f3" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* deodars */}
      {[
        [40, 300, 1.2],
        [80, 312, 0.9],
        [520, 304, 1.3],
        [560, 318, 1],
        [470, 316, 0.8],
        [140, 318, 0.7],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-3" y="-8" width="6" height="12" fill="#5a3b2b" />
          <path d="M-26 -6 L0 -30 L26 -6 Z M-21 -24 L0 -50 L21 -24 Z M-15 -42 L0 -68 L15 -42 Z M-8 -60 L0 -80 L8 -60 Z" fill="#1C352D" />
          <path d="M-6 -62 L0 -80 L6 -62 Z" fill="#f2f5f2" />
        </g>
      ))}
      {/* A-frame cabin with glowing glass */}
      <g transform="translate(170 300)">
        <path d="M-44 0 L0 -74 L44 0 Z" fill="#6E473B" />
        <path d="M-30 0 L0 -52 L30 0 Z" fill="#ffc27a" />
        <path d="M0 -52 V0 M-17 -24 H17" stroke="#3b2a22" strokeWidth="3" />
        <rect x="-52" y="0" width="104" height="6" fill="#a57a58" />
      </g>
      {/* heritage house */}
      <g transform="translate(410 300)">
        <rect x="-36" y="-40" width="72" height="40" fill="#d9cbb2" />
        <rect x="-40" y="-62" width="80" height="24" fill="#8a5a43" />
        <path d="M-48 -60 L0 -90 L48 -60 Z" fill="#3f6150" />
        {[-24, -4, 16].map((x) => (
          <rect key={x} x={x} y="-56" width="10" height="12" fill="#ffc27a" />
        ))}
      </g>
      {/* Rustam on the meadow */}
      <g transform="translate(232 330) scale(0.22)">
        <RustamFoxPaths />
      </g>
      <text x="40" y="70" fontFamily="var(--font-hand)" fontSize="46" fill="#1C352D" fontWeight="700">
        Greetings from
      </text>
      <text x="36" y="128" fontFamily="var(--font-display)" fontSize="64" fill="#6E473B" fontWeight="800" letterSpacing="2">
        SONAMARG
      </text>
      <text x="40" y="154" fontFamily="var(--font-sans)" fontSize="13" fill="#1C352D" letterSpacing="4" fontWeight="600">
        THE YAMSAR RESORT · KULLAN
      </text>
      <rect x="6" y="6" width="588" height="388" fill="none" stroke="#fbf7ef" strokeWidth="10" />
    </svg>
  )
}

function RustamFoxPaths() {
  return (
    <g>
      <path d="M168 250 C 240 250, 258 170, 222 130 C 214 176, 196 210, 150 222 Z" fill="#c4572b" />
      <path d="M78 262 C 60 200, 82 150, 130 146 C 178 150, 198 200, 182 262 Z" fill="#d0612f" />
      <path d="M104 262 C 98 214, 112 176, 130 172 C 148 176, 162 214, 156 262 Z" fill="#fbf4ea" />
      <path d="M70 92 L 58 34 L 104 66 Z M190 92 L 202 34 L 156 66 Z" fill="#c4572b" />
      <path d="M130 56 C 178 56, 204 90, 196 120 C 186 148, 156 158, 130 162 C 104 158, 74 148, 64 120 C 56 90, 82 56, 130 56 Z" fill="#d86a34" />
      <path d="M92 68 C 96 40, 164 40, 168 68 C 150 62, 110 62, 92 68 Z" fill="#4a3a33" />
      <ellipse cx="108" cy="102" rx="7" ry="9" fill="#2b241f" />
      <ellipse cx="152" cy="102" rx="7" ry="9" fill="#2b241f" />
    </g>
  )
}

/** Small storybook vignette for each stay card. */
export function StayVignette({ kind, night }: { kind: 'aframe' | 'riverfront' | 'glacier'; night?: boolean }) {
  const glow = night ? '#ffc27a' : '#cfe3ea'
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="320" height="200" fill={night ? '#1e2a40' : '#dbe8ea'} />
      <path d="M-10 140 L50 60 L90 100 L150 40 L210 110 L260 70 L330 140 Z" fill={night ? '#46546a' : '#a8b6bd'} />
      <path d="M50 60 L62 78 L50 74 L40 80 Z M150 40 L166 64 L152 58 L140 66 Z M260 70 L272 88 L260 84 L250 88 Z" fill="#fbfbfb" />
      <rect y="140" width="320" height="60" fill={night ? '#2f4a38' : '#86a35c'} />
      {kind === 'riverfront' && <path d="M0 178 C 80 166, 160 196, 320 172 V200 H0 Z" fill="#2B7A78" />}
      {kind === 'aframe' && (
        <g transform="translate(160 150)">
          <path d="M-56 0 L0 -96 L56 0 Z" fill="#6E473B" />
          <path d="M-38 0 L0 -66 L38 0 Z" fill={glow} />
          <path d="M0 -66 V0 M-20 -30 H20" stroke="#3b2a22" strokeWidth="3" />
          <rect x="-66" y="0" width="132" height="8" fill="#a57a58" />
        </g>
      )}
      {kind === 'riverfront' && (
        <g transform="translate(160 150)">
          <rect x="-54" y="-50" width="108" height="50" fill="#d9cbb2" />
          <rect x="-60" y="-80" width="120" height="32" fill="#8a5a43" />
          <path d="M-72 -78 L0 -118 L72 -78 Z" fill="#3f6150" />
          {[-40, -12, 16].map((x) => (
            <rect key={x} x={x} y="-74" width="20" height="20" fill={glow} />
          ))}
          <rect x="-62" y="-48" width="124" height="5" fill="#5a3b2d" />
        </g>
      )}
      {kind === 'glacier' && (
        <g transform="translate(160 152)">
          <rect x="-50" y="-100" width="100" height="100" fill="#5c3d31" />
          <rect x="-40" y="-92" width="80" height="88" fill={glow} />
          <path d="M0 -92 V-4 M-40 -48 H40" stroke="#2c211c" strokeWidth="3" />
          <path d="M-60 -98 L0 -140 L60 -98 Z" fill="#39403f" />
          <rect x="-58" y="-50" width="116" height="5" fill="#3b2a22" />
        </g>
      )}
      {[30, 62, 270, 296].map((x, i) => (
        <path key={x} transform={`translate(${x} ${146 + (i % 2) * 6})`} d="M-14 0 L0 -26 L14 0 Z M-10 -16 L0 -40 L10 -16 Z M-6 -30 L0 -50 L6 -30 Z" fill={night ? '#16271f' : '#1C352D'} />
      ))}
    </svg>
  )
}
